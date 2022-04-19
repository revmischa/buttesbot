/* eslint-disable @typescript-eslint/no-unused-vars */
import { GenericMessageEvent } from "@slack/bolt";
import { WebClient } from "@slack/web-api";
import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import memoizee from "memoizee";
import { EvalContext, getInterp } from "./interp";
import { getSecrets } from "./secret";

const getSlackWeb = memoizee(async () => {
  const secrets = await getSecrets();
  return new WebClient(secrets.SLACK_KEY);
});

export const eventHandler: APIGatewayProxyHandlerV2 = async (event) => {
  const { body } = event;
  const bodyParsed = JSON.parse(body || "{}");
  const { type, challenge, event: slackEvent } = bodyParsed;

  if (!type) throw new Error("Missing event type");

  switch (type) {
    case "url_verification":
      return { statusCode: 200, body: challenge };
    case "event_callback":
      // console.log("slackEvent", slackEvent);
      await handleMessage(slackEvent);
      break;
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "text/plain" },
    body: `Ok`,
  };
};

const handleMessage = async (event: GenericMessageEvent) => {
  const interp = await getInterp();
  if (!event.text?.toLocaleLowerCase().startsWith("tcl ")) return;

  const matches = event.text.trim().match(/^\s*tcl\s*(.+)/i);
  if (!matches?.[1]) return;
  const toEval = matches[1].trim();

  const context: EvalContext = {
    channel: event.channel,
    nick: event.user,
  };

  // eval tcl
  let res: string, ok;
  try {
    res = await interp.eval(toEval, context);
    ok = true;
    res ||= "(no result)";
  } catch (ex) {
    console.error(ex);
    res = (ex as string).toString() || "Unknown error";
    ok = false;
  }

  const escaped = res.replace(/&/g, "&amp;").replace(/<(?![#@])/g, "&lt;");
  // .replace(/>/g, "&gt;");

  const slackWeb = await getSlackWeb();
  await slackWeb.chat.postMessage({
    text: escaped,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "```\n" + escaped + "\n```",
        },
      },
    ],
    channel: event.channel,
  });
};

export const evalHandler: APIGatewayProxyHandlerV2 = async (event) => {
  const { body } = event;
  const bodyParsed = JSON.parse(body || "{}");
  const { cmd } = bodyParsed;
  if (!cmd) throw new Error("Missing cmd");

  // const res = interp.eval(cmd);
  const res = "n/a";
  return { statusCode: 200, body: res };
};

export const authHandler: APIGatewayProxyHandlerV2 = async (event) => {
  return {
    statusCode: 302,
    headers: {
      Location:
        "https://slack.com/oauth/v2/authorize?client_id=2716024371.3834006739&scope=app_mentions:read,channels:read,chat:write,im:read,mpim:read,team:read,users:write",
    },
    body: `Ok`,
  };
};

export const authCompleteHandler: APIGatewayProxyHandlerV2 = async (event) => {
  return "not implemented";
};

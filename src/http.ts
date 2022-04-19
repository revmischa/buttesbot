import { GenericMessageEvent } from "@slack/bolt";
import { WebClient } from "@slack/web-api";
import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import memoizee from "memoizee";
import { getInterp } from "./interp";
import { getSecrets } from "./secret";

const getSlackWeb = memoizee(async () => {
  const secrets = await getSecrets();
  return new WebClient(secrets.SLACK_KEY);
});

export const eventHandler: APIGatewayProxyHandlerV2 = async (event) => {
  const { body } = event;
  const bodyParsed = JSON.parse(body || "{}");
  const { token, type, challenge, event: slackEvent } = bodyParsed;

  if (!type) throw new Error("Missing event type");

  switch (type) {
    case "url_verification":
      return { statusCode: 200, body: challenge };
    case "event_callback":
      console.log("slackEvent", slackEvent);
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

  const [_, args] = event.text.split("tcl ", 2);
  const nick = event.user || "you";

  // eval tcl
  let res: string, ok;
  try {
    res = await interp.eval(`${args}`);
    ok = true;
  } catch (ex) {
    res = (ex as any).toString();
    ok = false;
  }

  const escaped = res
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const slackWeb = await getSlackWeb();
  await slackWeb.chat.postMessage({
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

import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { Interp } from "./interp";
import { WebClient } from "@slack/web-api";
import { getSecrets } from "./secret";
import { GenericMessageEvent, MessageEvent } from "@slack/bolt";

const interp = new Interp();
await interp.loadState();

const secrets = await getSecrets();
const slackWeb = new WebClient(secrets.SLACK_KEY);
console.log("KEY", secrets.SLACK_KEY);

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
  if (event.text?.toLocaleLowerCase().startsWith("tcl ")) {
    const [_, args] = event.text.split("tcl ", 2);
    const nick = event.user || "you";

    // eval tcl
    let res, ok;
    try {
      res = await interp.eval(`${args}`);
      ok = true;
    } catch (ex) {
      res = ex;
      ok = false;
    }

    await slackWeb.chat.postMessage({
      attachments: [
        {
          pretext: "```\n" + res + "\n```",
        },
      ],
      channel: event.channel,
    });
  }
};

export const evalHandler: APIGatewayProxyHandlerV2 = async (event) => {
  const { body } = event;
  const bodyParsed = JSON.parse(body || "{}");
  const { cmd } = bodyParsed;
  if (!cmd) throw new Error("Missing cmd");

  const res = interp.eval(cmd);
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

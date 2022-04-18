import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { Interp } from "./interp";

const interp = new Interp();
await interp.loadState();

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
      break;
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "text/plain" },
    body: `Ok`,
  };
};

export const evalHandler: APIGatewayProxyHandlerV2 = async (event) => {
  const { body } = event;
  const bodyParsed = JSON.parse(body || "{}");
  const { cmd } = bodyParsed;
  if (!cmd) throw new Error("Missing cmd");

  const res = interp.cmd(cmd);
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

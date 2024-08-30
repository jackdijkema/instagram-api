# Instagram API 

An API to interact with Instagram

## Functionalities

- Send insta dm by username (unofficial api)
- Get current conversations (official)
- Show read status
- Use meta api to reply to already existing conversations (official) 

## Bugs

- Replied status broken 

## Getting Started

To get started with the api, follow these steps:

copy `example.env` to a new `.env` file

go to `Meta for Developers` -> create app -> make system user ->
make system user token -> get the instagram page id -> put in `.env` file.

If your `.env` file is filled in you can continue.

1. Install the necessary dependencies by running `npm install` or `npm ci`.

2. Start the development server by running `node .` or `npm start`.
   or
   Start the development server with `node . | pino-pretty` for a better info logging format.

example pino-pretty: `[23:55:54.866] INFO (1434): Server listening at http://0.0.0.0:8080`

example without: `{"level":30,"time":1717019787966,"pid":1708,"hostname":"hidden","msg":"Server listening at http://0.0.0.0:8080"}`

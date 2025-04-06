import { createClient } from "@openauthjs/openauth/client"
import { subjects } from "../auth/subjects"
import { Hono } from "hono"
import { serve } from '@hono/node-server'
import { cors } from "hono/cors"
import * as dotenv from "dotenv";

dotenv.config({
  path: ".env.local"
})

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "*",
}

const client = createClient({
  clientID: "jwt-api",
  issuer: process.env.AUTH_URL,
})

const app = new Hono()

app.use("*", cors({
  origin: [process.env.AUTH_URL ?? "" , process.env.CLIENT_URL ?? ""],
  allowHeaders: [...Object.keys(headers), "Authorization", "Content-Type"],
  allowMethods: ["GET", "POST", "PATCH", "OPTIONS"],
  credentials: true
}))

app.get(async(c) => {
  const url = new URL(c.req.url)

  if (url.pathname === "/") {
    const authHeader = c.req.header("Authorization")

    if (!authHeader) {
      return new Response("Unauthorized: No authorization header", { 
        headers, 
        status: 401 
      })
    }

    const token = authHeader.split(" ")[1]
    const verified = await client.verify(subjects, token)

    if (verified.err) {
      return new Response("Unauthorized: Invalid token", { 
        headers, 
        status: 401 
      })
    }

    return new Response(verified.subject.properties.userID, { headers })

  }

  return new Response("404", { status: 404 })

})

serve({
  fetch: app.fetch,
  port: 3001,
})



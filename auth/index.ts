import { issuer } from "@openauthjs/openauth"
import { MemoryStorage } from "@openauthjs/openauth/storage/memory"
import { PasswordUI } from "@openauthjs/openauth/ui/password"
import { serve } from "@hono/node-server"
import { subjects } from "./subjects"
import { PasswordProvider } from "@openauthjs/openauth/provider/password"
import { THEME_TERMINAL as THEME } from "@openauthjs/openauth/ui/theme"
import { cors } from 'hono/cors'
import * as dotenv from "dotenv";

dotenv.config({
  path: ".env.local"
})

async function getUser(email: string) {
  // Get user from database
  // Return user ID
  return "123"
}

const app = issuer({
  subjects,
  theme: THEME,
  storage: MemoryStorage({
    persist: "./persist.json",
  }),
  allow: async (input, req) => {
    return true
  },
  providers: {
    password: PasswordProvider(
      PasswordUI({
        sendCode: async (email, code) => {
          console.log(email, code)
        },
      }),
    ),
  },
  success: async (ctx, value) => {
    if (value.provider === "password") {
      console.log(value)
      return ctx.subject("user", {
        userID: await getUser(value.email),
      })
    }
    throw new Error("Invalid provider")
  },

})

app.use("*", cors({
  origin: [process.env.CLIENT_URL ?? "http://localhost:5173"]
}))

serve(app)
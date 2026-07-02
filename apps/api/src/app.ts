import express from "express";

export const app = express();
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/subscriptions", (req, res) => {
  res.json({ status: "received" });
})

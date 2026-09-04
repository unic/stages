import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { EventLaunchApp } from "./EventLaunchApp.js";
import "../../shared/event-launch/styles.css";
import "./styles.css";

const root = document.querySelector("#root");
if (root === null) throw new Error("Missing React root element.");
createRoot(root).render(<StrictMode><EventLaunchApp adapter="React" /></StrictMode>);

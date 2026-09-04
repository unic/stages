import { bootstrapApplication } from "@angular/platform-browser";
import { EventLaunchAppComponent } from "./event-launch-app.js";

bootstrapApplication(EventLaunchAppComponent).catch((error: unknown) => console.error(error));

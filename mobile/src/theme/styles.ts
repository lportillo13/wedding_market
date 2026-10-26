import { accountStyles } from "./styles/account";
import { adminStyles } from "./styles/admin";
import { authStyles } from "./styles/auth";
import { homeStyles } from "./styles/home";
import { inboxStyles } from "./styles/inbox";
import { inquiriesStyles } from "./styles/inquiries";
import { sharedStyles } from "./styles/shared";
import { shellStyles } from "./styles/shell";
import { shortlistStyles } from "./styles/shortlist";
import { uiStyles } from "./styles/ui";
import { vendorsStyles } from "./styles/vendors";

// One typed public surface; style definitions are separated by feature.
export const styles = {
  ...shellStyles,
  ...sharedStyles,
  ...authStyles,
  ...uiStyles,
  ...vendorsStyles,
  ...accountStyles,
  ...shortlistStyles,
  ...inquiriesStyles,
  ...adminStyles,
  ...inboxStyles,
  ...homeStyles
};

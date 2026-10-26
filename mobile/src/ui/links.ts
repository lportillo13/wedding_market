import { publicWebUrl } from "../lib/urls";
import { Linking } from "react-native";

export function openPublicWebPath(path: string) {
  return Linking.openURL(publicWebUrl(path));
}

import { Platform } from "react-native";

export const colors = {
  ink: "#161A1D",
  muted: "#6D747A",
  line: "#ECEFF1",
  paper: "#FFFFFF",
  warm: "#F8F8F6",
  teal: "#1D7A72",
  tealDark: "#161A1D",
  gold: "#F1B84B",
  blush: "#FFF0EE",
  soft: "#F2F4F3",
};


export const fontFamilies = {
  body: Platform.select({ android: "sans-serif", ios: "System", default: undefined }),
  displayRegular: "PlayfairDisplay_400Regular",
  displayMedium: "PlayfairDisplay_500Medium",
  displayBold: "PlayfairDisplay_700Bold",
  displayBlack: "PlayfairDisplay_900Black",
};

import { Platform } from "react-native";

export const colors = {
  ink: "#4B352C",
  muted: "#776554",
  line: "#E8DED1",
  paper: "#FFFEFC",
  warm: "#FBF7F0",
  teal: "#765943",
  tealDark: "#4B352C",
  gold: "#C9AC79",
  blush: "#F8EEEA",
  soft: "#F2ECE3",
};


export const fontFamilies = {
  body: Platform.select({ android: "sans-serif", ios: "System", default: undefined }),
  displayRegular: "PlayfairDisplay_400Regular",
  displayMedium: "PlayfairDisplay_500Medium",
  displayBold: "PlayfairDisplay_700Bold",
  displayBlack: "PlayfairDisplay_900Black",
};

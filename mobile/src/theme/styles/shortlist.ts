import { colors, radii } from "../tokens";
import { StyleSheet } from "react-native";
export const shortlistStyles = StyleSheet.create({
    favoriteBatchButton: {
        alignItems: "center",
        alignSelf: "flex-start",
        backgroundColor: colors.ink,
        borderRadius: radii.control,
        flexDirection: "row",
        gap: 8,
        justifyContent: "center",
        marginTop: 14,
        minHeight: 48,
        paddingHorizontal: 18,
    }
});

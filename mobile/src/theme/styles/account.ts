import { colors, radii } from "../tokens";
import { StyleSheet } from "react-native";
export const accountStyles = StyleSheet.create({
    formSection: {
        backgroundColor: colors.paper,
        borderColor: colors.line,
        borderRadius: radii.surface,
        borderWidth: 1,
        gap: 10,
        marginTop: 14,
        padding: 16,
    },
    inputDisabled: {
        backgroundColor: colors.soft,
        color: colors.muted,
    },
    profileHero: {
        alignItems: "center",
        backgroundColor: colors.soft,
        borderRadius: radii.surface,
        flexDirection: "row",
        gap: 14,
        padding: 18,
    },
    profileAvatar: {
        alignItems: "center",
        backgroundColor: colors.ink,
        borderRadius: 28,
        height: 56,
        justifyContent: "center",
        width: 56,
    }
});

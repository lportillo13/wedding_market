import { colors, fontFamilies, radii } from "../tokens";
import { StyleSheet } from "react-native";
export const adminStyles = StyleSheet.create({
    dashboardGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
    },
    dashboardStat: {
        backgroundColor: colors.paper,
        borderColor: colors.line,
        borderRadius: radii.surface,
        borderWidth: 1,
        minHeight: 118,
        padding: 14,
        width: "48%",
    },
    dashboardStatValue: {
        fontFamily: fontFamilies.body,
        lineHeight: 38,
        color: colors.ink,
        fontSize: 26,
        fontWeight: "normal",
        marginTop: 12,
    },
    dashboardStatLabel: {
        fontFamily: fontFamilies.body,
        lineHeight: 18,
        color: colors.muted,
        fontSize: 12,
        fontWeight: "normal",
        marginTop: 4,
    }
});

import { colors } from "../tokens";
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
        borderRadius: 24,
        borderWidth: 1,
        minHeight: 118,
        padding: 14,
        width: "48%",
    },
    dashboardStatValue: {
        color: colors.ink,
        fontSize: 26,
        fontWeight: "900",
        marginTop: 12,
    },
    dashboardStatLabel: {
        color: colors.muted,
        fontSize: 12,
        fontWeight: "800",
        marginTop: 4,
    }
});

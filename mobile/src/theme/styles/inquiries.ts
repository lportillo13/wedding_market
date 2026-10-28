import { colors, fontFamilies, radii } from "../tokens";
import { StyleSheet } from "react-native";
export const inquiriesStyles = StyleSheet.create({
    inputError: {
        borderColor: "#B42318",
    },
    requiredHint: {
        fontFamily: fontFamilies.body,
        lineHeight: 18,
        color: colors.muted,
        fontSize: 12,
        fontWeight: "normal",
    },
    modalBackdrop: {
        backgroundColor: "rgba(22,26,29,0.32)",
        flex: 1,
        justifyContent: "flex-end",
    },
    quoteModal: {
        backgroundColor: colors.paper,
        borderTopLeftRadius: 34,
        borderTopRightRadius: 34,
        maxHeight: "92%",
        paddingHorizontal: 18,
        paddingTop: 10,
    },
    quoteModalHandle: {
        alignSelf: "center",
        backgroundColor: colors.line,
        borderRadius: radii.surface,
        height: 5,
        marginBottom: 12,
        width: 52,
    },
    quoteModalHeader: {
        alignItems: "center",
        flexDirection: "row",
        gap: 12,
        paddingBottom: 12,
    },
    quoteModalBody: {
        gap: 10,
        paddingBottom: 28,
    },
    modalCloseButton: {
        alignItems: "center",
        backgroundColor: colors.soft,
        borderRadius: 999,
        height: 42,
        justifyContent: "center",
        width: 42,
    },
    formTwoColumn: {
        flexDirection: "row",
        gap: 10,
    },
    formHalf: {
        flex: 1,
        gap: 7,
    }
});

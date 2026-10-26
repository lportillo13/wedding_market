import { colors, fontFamilies } from "../tokens";
import { StyleSheet } from "react-native";
export const vendorEditorStyles = StyleSheet.create({
    languageSegment: {
        alignSelf: "flex-start",
        backgroundColor: colors.soft,
        borderRadius: 999,
        flexDirection: "row",
        gap: 4,
        padding: 4,
    },
    languageSegmentButton: {
        borderRadius: 999,
        paddingHorizontal: 14,
        paddingVertical: 8,
    },
    languageSegmentButtonActive: {
        backgroundColor: colors.ink,
    },
    languageSegmentText: {
        color: colors.muted,
        fontSize: 12,
        fontWeight: "900",
    },
    languageSegmentTextActive: {
        color: "#FFFFFF",
    },
    formField: {
        gap: 7,
    },
    vendorWorkspaceHero: {
        borderRadius: 28,
        height: 270,
        marginBottom: 14,
        overflow: "hidden",
        position: "relative",
    },
    vendorWorkspaceImage: {
        height: "100%",
        width: "100%",
    },
    vendorWorkspaceOverlay: {
        backgroundColor: "rgba(0,0,0,0.32)",
        bottom: 0,
        left: 0,
        position: "absolute",
        right: 0,
        top: 0,
    },
    vendorWorkspaceCopy: {
        bottom: 0,
        left: 0,
        padding: 18,
        position: "absolute",
        right: 0,
    },
    editorTabs: {
        gap: 8,
        paddingBottom: 12,
    },
    editorTab: {
        alignItems: "center",
        backgroundColor: colors.soft,
        borderRadius: 999,
        flexDirection: "row",
        gap: 6,
        minHeight: 40,
        paddingHorizontal: 13,
    },
    editorTabActive: {
        backgroundColor: colors.ink,
    },
    editorTabText: {
        color: colors.tealDark,
        fontSize: 12,
        fontWeight: "900",
    },
    editorTabTextActive: {
        color: colors.paper,
    },
    editorPanel: {
        backgroundColor: colors.paper,
        borderColor: colors.line,
        borderRadius: 26,
        borderWidth: 1,
        gap: 14,
        padding: 16,
    },
    editorSubCard: {
        backgroundColor: colors.soft,
        borderRadius: 22,
        gap: 10,
        padding: 14,
    },
    editorChipSelected: {
        backgroundColor: "#DFF1ED",
        borderColor: colors.teal,
        borderWidth: 1,
    },
    imageUploadGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
    },
    imageUploadButton: {
        alignItems: "center",
        backgroundColor: colors.soft,
        borderRadius: 20,
        flexDirection: "row",
        gap: 8,
        minHeight: 48,
        paddingHorizontal: 12,
        width: "48%",
    },
    currentMediaGrid: {
        gap: 12,
    },
    currentMediaCard: {
        backgroundColor: colors.soft,
        borderRadius: 24,
        gap: 10,
        overflow: "hidden",
        padding: 12,
    },
    currentMediaCardCompact: {
        alignItems: "center",
    },
    currentMediaImage: {
        borderRadius: 18,
        height: 180,
        width: "100%",
    },
    currentMediaImageCompact: {
        height: 96,
        width: 140,
    },
    currentMediaFallback: {
        alignItems: "center",
        backgroundColor: "#D7D7D4",
        borderRadius: 18,
        height: 180,
        justifyContent: "center",
        width: "100%",
    },
    currentMediaFallbackText: {
        color: colors.muted,
        fontSize: 14,
        fontWeight: "900",
    },
    uploadProgressCard: {
        backgroundColor: "#E8F7EE",
        borderRadius: 20,
        gap: 9,
        padding: 12,
    },
    uploadProgressHeader: {
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "space-between",
    },
    uploadProgressTitle: {
        color: colors.ink,
        fontSize: 13,
        fontWeight: "900",
    },
    uploadProgressPercent: {
        color: colors.tealDark,
        fontSize: 13,
        fontWeight: "900",
    },
    uploadProgressTrack: {
        backgroundColor: "rgba(29,122,114,0.18)",
        borderRadius: 999,
        height: 8,
        overflow: "hidden",
    },
    uploadProgressFill: {
        backgroundColor: colors.teal,
        borderRadius: 999,
        height: "100%",
    },
    uploadProgressStatus: {
        color: colors.muted,
        fontSize: 12,
        fontWeight: "800",
    },
    detailTitle: {
        color: "#FFFFFF",
        fontFamily: fontFamilies.displayRegular,
        fontSize: 34,
        fontWeight: "400",
        lineHeight: 38,
    },
    detailCategories: {
        color: "rgba(255,255,255,0.84)",
        fontSize: 13,
        fontWeight: "800",
        marginTop: 8,
    },
    detailChips: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginTop: 14,
    },
    detailChip: {
        alignItems: "center",
        backgroundColor: colors.soft,
        borderRadius: 999,
        flexDirection: "row",
        gap: 5,
        paddingHorizontal: 10,
        paddingVertical: 7,
    },
    detailChipText: {
        color: colors.tealDark,
        fontSize: 12,
        fontWeight: "800",
    },
    galleryStrip: {
        gap: 10,
        paddingRight: 4,
    },
    galleryImage: {
        backgroundColor: colors.line,
        borderRadius: 22,
        height: 150,
        width: 210,
    }
});

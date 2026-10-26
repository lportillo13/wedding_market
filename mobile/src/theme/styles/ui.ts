import { colors } from "../tokens";
import { StyleSheet } from "react-native";
export const uiStyles = StyleSheet.create({
    signupFieldLabel: {
        textAlign: "center",
    },
    quoteSelectedDateRow: {
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "space-between",
        minHeight: 28,
    },
    quoteClearDateText: {
        color: "#B42318",
        fontSize: 12,
        fontWeight: "800",
        marginTop: 8,
    },
    nativeSelectBlock: {
        gap: 8,
        marginTop: 4,
    },
    nativeSelectHeader: {
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 10,
    },
    nativeSelectHelper: {
        color: colors.muted,
        fontSize: 12,
        fontWeight: "800",
    },
    nativeSelectOptions: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
    nativeSelectPill: {
        backgroundColor: colors.soft,
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 9,
    },
    nativeSelectPillActive: {
        backgroundColor: colors.ink,
    },
    nativeSelectText: {
        color: colors.muted,
        fontSize: 12,
        fontWeight: "800",
    },
    nativeSelectTextActive: {
        color: colors.paper,
    },
    countryDropdownBlock: {
        gap: 8,
    },
    countryDropdownTrigger: {
        alignItems: "center",
        backgroundColor: colors.paper,
        borderColor: colors.line,
        borderRadius: 16,
        borderWidth: 1,
        flexDirection: "row",
        justifyContent: "space-between",
        minHeight: 48,
        paddingHorizontal: 12,
    },
    countryDropdownTriggerActive: {
        borderColor: colors.ink,
    },
    countryDropdownValue: {
        color: colors.ink,
        flex: 1,
        fontSize: 15,
        fontWeight: "700",
    },
    countryDropdownValueCentered: {
        paddingHorizontal: 24,
        textAlign: "center",
    },
    countryDropdownIconCentered: {
        position: "absolute",
        right: 12,
    },
    countryDropdownPlaceholder: {
        color: colors.muted,
    },
    countryDropdownMenu: {
        backgroundColor: colors.paper,
        borderColor: colors.line,
        borderRadius: 18,
        borderWidth: 1,
        padding: 10,
    },
    countrySearchInputWrap: {
        alignItems: "center",
        backgroundColor: colors.soft,
        borderRadius: 14,
        flexDirection: "row",
        gap: 8,
        minHeight: 42,
        paddingHorizontal: 10,
    },
    countrySearchInput: {
        color: colors.ink,
        flex: 1,
        fontSize: 15,
        minHeight: 42,
        padding: 0,
    },
    countrySearchInputCentered: {
        paddingHorizontal: 28,
        textAlign: "center",
    },
    countrySearchIconCentered: {
        left: 12,
        position: "absolute",
        zIndex: 1,
    },
    countryOptionsList: {
        marginTop: 8,
        maxHeight: 220,
    },
    countryOptionRow: {
        alignItems: "center",
        borderRadius: 12,
        flexDirection: "row",
        justifyContent: "space-between",
        minHeight: 40,
        paddingHorizontal: 10,
    },
    countryOptionRowActive: {
        backgroundColor: colors.soft,
    },
    countryOptionText: {
        color: colors.ink,
        flex: 1,
        fontSize: 14,
        fontWeight: "700",
    },
    countryOptionTextCentered: {
        paddingHorizontal: 24,
        textAlign: "center",
    },
    countryOptionCheckCentered: {
        position: "absolute",
        right: 10,
    },
    countryOptionTextActive: {
        fontWeight: "900",
    },
    countryNoResults: {
        color: colors.muted,
        fontSize: 13,
        fontWeight: "700",
        padding: 12,
        textAlign: "center",
    },
    availabilityMonths: {
        gap: 12,
        marginTop: 12,
    },
    availabilityMonthScroller: {
        gap: 12,
        paddingRight: 4,
    },
    availabilityLegend: {
        alignItems: "center",
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
    },
    availabilityLegendItem: {
        alignItems: "center",
        flexDirection: "row",
        gap: 6,
    },
    availabilityLegendDot: {
        borderRadius: 999,
        height: 10,
        width: 10,
    },
    availabilityLegendOpen: {
        backgroundColor: "#26A269",
    },
    availabilityLegendBusy: {
        backgroundColor: "#D92D20",
    },
    availabilityMonthCard: {
        backgroundColor: colors.soft,
        borderRadius: 22,
        padding: 12,
    },
    availabilityCalendarTitle: {
        color: colors.ink,
        fontSize: 15,
        fontWeight: "900",
        marginBottom: 10,
    },
    availabilityWeekdays: {
        flexDirection: "row",
        marginBottom: 6,
    },
    availabilityWeekday: {
        color: colors.muted,
        flex: 1,
        fontSize: 11,
        fontWeight: "900",
        textAlign: "center",
    },
    availabilityCalendarGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        rowGap: 6,
    },
    availabilityCalendarDayBlank: {
        aspectRatio: 1,
        width: "14.285%",
    },
    availabilityCalendarDay: {
        alignItems: "center",
        aspectRatio: 1,
        borderColor: "rgba(15,118,110,0.12)",
        borderRadius: 8,
        borderWidth: 1,
        justifyContent: "center",
        position: "relative",
        width: "14.285%",
    },
    availabilityCalendarNumber: {
        color: colors.ink,
        fontSize: 13,
        fontWeight: "800",
        includeFontPadding: false,
        left: 0,
        lineHeight: 18,
        position: "absolute",
        right: 0,
        textAlign: "center",
        textAlignVertical: "center",
        top: "50%",
        transform: [{ translateY: -9 }],
    },
    availabilityCalendarNumberOpen: {
        color: "#067647",
    },
    availabilityCalendarNumberBusy: {
        color: "#B42318",
    },
    availabilityDot: {
        backgroundColor: "#067647",
        borderRadius: 999,
        bottom: 5,
        height: 5,
        position: "absolute",
        width: 5,
    },
    availabilityDotBusy: {
        backgroundColor: "#B42318",
    },
    availabilityDayOpen: {
        backgroundColor: "#D8F5E4",
        borderColor: "#26A269",
    },
    availabilityDayBusy: {
        backgroundColor: "#FFE1DF",
        borderColor: "#D92D20",
    }
});

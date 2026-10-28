import { colors, fontFamilies } from "../tokens";
import { StyleSheet } from "react-native";
export const homeStyles = StyleSheet.create({
    logoCarouselBlock: {
        marginTop: 22,
    },
    logoCarousel: {
        gap: 10,
        paddingRight: 18,
    },
    logoCarouselItem: {
        alignItems: "center",
        backgroundColor: colors.paper,
        borderColor: colors.line,
        borderRadius: 999,
        borderWidth: 1,
        height: 72,
        justifyContent: "center",
        padding: 8,
        width: 76,
    },
    logoCarouselImage: {
        borderRadius: 999,
        height: 54,
        resizeMode: "contain",
        width: 54,
    },
    logoCarouselFallback: {
        alignItems: "center",
        backgroundColor: colors.soft,
        borderRadius: 999,
        height: 54,
        justifyContent: "center",
        width: 54,
    },
    logoCarouselInitials: {
        fontFamily: fontFamilies.body,
        lineHeight: 24,
        color: colors.tealDark,
        fontSize: 16,
        fontWeight: "normal",
    }
});

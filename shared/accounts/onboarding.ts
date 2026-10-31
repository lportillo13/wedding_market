import { parseCalendarDate } from '../calendar/date';
export type PlanningDetails = {
    fullName: string;
    phone: string;
    country: string;
    weddingTheme: string;
    weddingDate: string;
    guestCount: string;
    weddingBudget: string;
};
export function planningIssue(form: PlanningDetails, step: number): string | null {
    if (step === 0 && (!form.fullName.trim() || form.fullName.trim().length > 200))
        return 'name';
    if (step === 1 && (!form.phone.trim() || form.phone.length > 40 || !form.country.trim() || form.country.length > 80))
        return 'contact';
    if (step === 2 && !['classic', 'boho', 'rustic', 'beach', 'garden', 'modern', 'vintage'].includes(form.weddingTheme))
        return 'style';
    if (step === 3 && !parseCalendarDate(form.weddingDate))
        return 'date';
    if (step === 4) {
        if (form.guestCount.trim() && (!Number.isInteger(Number(form.guestCount)) || Number(form.guestCount) < 1 || Number(form.guestCount) > 100000))
            return 'guests';
        if (form.weddingBudget.trim() && (!Number.isFinite(Number(form.weddingBudget)) || Number(form.weddingBudget) < 0 || Number(form.weddingBudget) > 1000000000))
            return 'budget';
    }
    return null;
}
export function firstPlanningStep(form: PlanningDetails) {
    for (let step = 0; step < 4; step++)
        if (planningIssue(form, step))
            return step;
    return 4;
}

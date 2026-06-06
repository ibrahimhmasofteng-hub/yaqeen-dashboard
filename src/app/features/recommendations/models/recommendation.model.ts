export interface PageRecommendationDTO {
    page: number;
    reason: string;
    priority: number;
}

export interface ErrorTypeSummaryDTO {
    type: string;
    count: number;
}

export interface SurahErrorSummaryDTO {
    surahId: number;
    surahName: string;
    surahArabicName: string | null;
    errorCount: number;
}

export interface RecommendationResponseDTO {
    pagesToReview: PageRecommendationDTO[];
    pagesToMemorize: PageRecommendationDTO[];
    errorTypeSummary: ErrorTypeSummaryDTO[];
    weakSurahs: SurahErrorSummaryDTO[];
}

export interface ProblematicVerseDTO {
    verseNumber: number;
    page: number;
    errorCount: number;
}

export interface SurahTestRecommendationDTO {
    surahId: number;
    surahName: string;
    surahArabicName: string | null;
    ayahCount: number;
    totalErrors: number;
    priorityScore: number;
    problematicVerses: ProblematicVerseDTO[];
}

export interface JuzzTestResponseDTO {
    recommendations: SurahTestRecommendationDTO[];
    totalErrorsFound: number;
}

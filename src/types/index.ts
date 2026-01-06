export interface FaceRecognitionResult {
    detectedFaces: Array<{
        id: string;
        name: string;
        confidence: number;
    }>;
    status: string;
}
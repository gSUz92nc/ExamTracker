interface Paper {
	id: number;
	subject: string;
	board: string;
	year: number;
	season: string;
	paper: string;
	totalMarks?: number; // Now optional as it will be calculated
	questions: Question[]; // Questions for this paper
	url?: string; // Optional URL to the paper
}

interface Question {
	number: number;
	marks: number;
}

export const pastPapers: Paper[] = [];

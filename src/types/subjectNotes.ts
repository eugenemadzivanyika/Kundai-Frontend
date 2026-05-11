export interface SubtopicNote {
  subtopicName: string;
  content: string;
  generatedAt: string;
  lastUpdated: string;
}

export interface TopicNotes {
  topicName: string;
  topicCode: string;
  subtopics: SubtopicNote[];
}

export interface SubjectNotesDoc {
  _id: string;
  subject: string;
  topics: TopicNotes[];
}

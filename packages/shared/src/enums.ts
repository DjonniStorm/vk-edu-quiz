export enum UserRole {
  User = "USER",
  Admin = "ADMIN",
}

export enum SessionRole {
  Organizer = "organizer",
  Participant = "participant",
}

export enum QuizStatus {
  Draft = "DRAFT",
  Published = "PUBLISHED",
  Archived = "ARCHIVED",
}

export enum AnswerMode {
  Single = "SINGLE",
  Multiple = "MULTIPLE",
}

export enum RoomStatus {
  Waiting = "WAITING",
  Active = "ACTIVE",
  Finished = "FINISHED",
  Cancelled = "CANCELLED",
}

export enum ParticipantStatus {
  Connected = "CONNECTED",
  Disconnected = "DISCONNECTED",
  Finished = "FINISHED",
}

export enum RealtimeEventType {
  RoomStarted = "room.started",
  QuestionShown = "question.shown",
  ParticipantJoined = "participant.joined",
  AnswerSubmitted = "answer.submitted",
  QuestionRevealed = "question.revealed",
  LeaderboardUpdated = "leaderboard.updated",
  RoomFinished = "room.finished",
}

export enum ErrorCode {
  BadRequest = "BAD_REQUEST",
  Unauthorized = "UNAUTHORIZED",
  Forbidden = "FORBIDDEN",
  NotFound = "NOT_FOUND",
  Conflict = "CONFLICT",
  ValidationError = "VALIDATION_ERROR",
  NotImplemented = "NOT_IMPLEMENTED",
  InternalServerError = "INTERNAL_SERVER_ERROR",
}

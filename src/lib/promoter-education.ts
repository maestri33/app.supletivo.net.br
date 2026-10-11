export function educationGrades(level: string): number[] {
  if (level === "fundamental") return [1, 2, 3, 4, 5, 6, 7, 8, 9];
  if (level === "medio") return [1, 2, 3];
  return [];
}

export function candidateEducationPayload(level: string, completed: boolean, grade: number, lastCompletedGrade: number, qualification: string) {
  if (level === "superior") return { level, completed, qualification, education_status: completed ? "completed" : "stopped" };
  const grades = educationGrades(level);
  if (!grades.includes(grade) || (!completed && (!Number.isInteger(lastCompletedGrade) || lastCompletedGrade < 0 || lastCompletedGrade >= grade))) {
    throw new Error("Confira a última série cursada e a última série concluída.");
  }
  return { level, completed: completed && grade === grades[grades.length - 1], grade, last_completed_grade: completed ? grade : lastCompletedGrade, education_status: completed ? "completed" : "stopped" };
}

/**
 * The shapes this feature's components take as props.
 *
 * Named against the generated schema rather than restated: a field the API drops
 * should fail this build, which is the whole reason the client is generated.
 */
import type { components } from '$lib/api/schema';

export type CourseDetail = components['schemas']['CourseDetail'];
export type TopicView = components['schemas']['TopicView'];
export type LessonView = components['schemas']['LessonView'];
export type Announcement = components['schemas']['AnnouncementView'];
export type Review = components['schemas']['ReviewView'];
export type Progress = components['schemas']['ProgressView'];
export type EnrolmentSource = components['schemas']['EnrolmentView']['source'];

/** This reader's own enrolment on the course, as the panel needs it. */
export type Enrolment = Pick<components['schemas']['EnrolmentView'], 'status' | 'source'>;

export type ReviewSummary = { count: number; average: number };

/** A course this one requires, and whether this reader has finished it. */
export type Prerequisite = { slug: string; title: string; done: boolean };

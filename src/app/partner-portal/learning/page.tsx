import React from 'react';
import Link from 'next/link';
import { requirePartnerSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db';
import { enrollCourseAction } from '@/lib/actions/learning';
import { GraduationCap, Clock, Award, CheckCircle2, PlayCircle, BookOpen, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const dynamic = 'force-dynamic';

export default async function PartnerLearningPage({
  searchParams,
}: {
  searchParams: Promise<{ track?: string; q?: string }>;
}) {
  const session = await requirePartnerSession();
  const { track, q } = await searchParams;

  const where: any = { is_published: true };
  if (track) where.track = track;
  if (q && q.trim()) {
    where.OR = [
      { title: { contains: q.trim(), mode: 'insensitive' } },
      { description: { contains: q.trim(), mode: 'insensitive' } },
    ];
  }

  const [courses, userEnrollments] = await Promise.all([
    prisma.course.findMany({ where, orderBy: { created_at: 'asc' } }),
    prisma.courseEnrollment.findMany({
      where: { user_id: session.userId },
    }),
  ]);

  const enrollmentMap = new Map(userEnrollments.map((e) => [e.course_id, e]));

  const tracks = ['All Tracks', 'Sales', 'Presales', 'Technical'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <GraduationCap className="h-6 w-6 text-cyan-400" />
            <span>Partner Learning & Training</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Build PAM domain mastery, zero-trust technical competence, and complete official certification tracks.
          </p>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
        <div className="flex items-center gap-2 overflow-x-auto">
          {tracks.map((t) => {
            const isAll = t === 'All Tracks';
            const isActive = isAll ? !track : track === t;
            return (
              <Link
                key={t}
                href={isAll ? '/partner-portal/learning' : `/partner-portal/learning?track=${t}`}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {t}
              </Link>
            );
          })}
        </div>

        <form method="GET" action="/partner-portal/learning" className="relative min-w-[240px]">
          {track && <input type="hidden" name="track" value={track} />}
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            name="q"
            defaultValue={q || ''}
            placeholder="Search courses..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
        </form>
      </div>

      {/* Course Grid */}
      {courses.length === 0 ? (
        <div className="py-16 text-center rounded-xl bg-slate-900/40 border border-dashed border-slate-800 p-8 space-y-3">
          <BookOpen className="h-8 w-8 text-slate-600 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-300">No courses match this filter</h3>
          <p className="text-xs text-slate-500">Try switching track filters or clearing your search term.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {courses.map((course) => {
            const enrollment = enrollmentMap.get(course.id);
            const isCompleted = enrollment?.status === 'completed';

            return (
              <div
                key={course.id}
                className="p-5 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant={course.track === 'Technical' ? 'info' : 'warning'} size="sm">
                      {course.track}
                    </Badge>
                    <span className="text-[11px] text-slate-400 font-medium">{course.level}</span>
                  </div>

                  <h3 className="text-base font-bold text-white tracking-tight">{course.title}</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{course.description}</p>
                </div>

                <div className="border-t border-slate-800/80 pt-3 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-slate-500" />
                      <span>{course.duration_minutes} mins</span>
                    </span>
                    <span>&bull;</span>
                    <span>{course.modules_count} Modules</span>
                  </div>

                  {isCompleted ? (
                    <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Completed</span>
                    </div>
                  ) : (
                    <form action={enrollCourseAction}>
                      <input type="hidden" name="courseId" value={course.id} />
                      <Button type="submit" variant="primary" size="sm" className="gap-1.5 text-xs font-semibold">
                        <PlayCircle className="h-3.5 w-3.5" />
                        <span>Complete Course</span>
                      </Button>
                    </form>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

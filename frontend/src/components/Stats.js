import Section from "./Section";

const EVENT_LABELS = {
  page_view: "Page views",
  section_view: "Section views",
  cta_click: "Get-in-touch clicks",
  social_click: "Social link clicks",
  github_click: "GitHub clicks",
  linkedin_click: "LinkedIn clicks",
  leetcode_click: "LeetCode clicks",
  email_click: "Email clicks",
  share_click: "Share links copied",
  ask_open: "Assistant opened",
  ask_question: "Questions asked",
  resume_view: "Resume views",
  resume_download: "Resume downloads",
  resume_print: "Resume prints",
  contact_submit: "Messages sent",
  project_click: "Project clicks",
  project_preview: "Live previews",
  project_case_study: "Case studies read",
  palette_open: "Palette opened",
  palette_command: "Palette commands",
  theme_toggle: "Theme toggles",
  music_play: "Music plays",
};

const eventLabel = (event) =>
  EVENT_LABELS[event] ?? event.replaceAll("_", " ");

function StatCard({ label, value, live }) {
  return (
    <div className="glass-card p-5 text-center">
      <p className="font-display text-3xl font-bold text-white">
        {live && <span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-accent align-middle" aria-hidden="true" />}
        {value.toLocaleString()}
      </p>
      <p className="mt-1 font-mono text-xs uppercase tracking-widest text-slate-500">{label}</p>
    </div>
  );
}

export default function Stats({ state, projectNames = {} }) {
  return (
    <Section id="stats" num="08" eyebrow="transparency" title="Stats" state={state}>
      {(data) => {
        const daily = data.daily_views ?? [];
        const max = Math.max(1, ...daily.map((day) => day.views));
        const events = Object.entries(data.events ?? {}).slice(0, 8);
        const projects = Object.entries(data.projects ?? {});
        return (
          <div className="space-y-8">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <StatCard label="Total views" value={data.total_views} />
              <StatCard label="Viewing now" value={data.viewing_now} live />
              <StatCard label="Views · 14 days" value={daily.reduce((sum, day) => sum + day.views, 0)} />
            </div>

            {daily.length > 0 && (
              <div className="glass-card p-5 sm:p-7">
                <p className="font-mono text-xs uppercase tracking-widest text-slate-500">Views per day · last 14 days</p>
                <div className="mt-4 flex h-32 items-end gap-1.5" role="img"
                  aria-label={`Daily views for the last ${daily.length} days`}>
                  {daily.map((day) => (
                    <div key={day.date} className="group relative flex h-full flex-1 items-end">
                      <div className="w-full rounded-t bg-accent/60 transition-colors group-hover:bg-accent"
                        style={{ height: `${Math.max(4, (day.views / max) * 100)}%` }} />
                      <span className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded border border-edge bg-ink px-1.5 py-0.5 font-mono text-[10px] text-slate-300 opacity-0 transition-opacity group-hover:opacity-100">
                        {day.views} · {day.date.slice(5)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex justify-between font-mono text-[10px] text-slate-600">
                  <span>{daily[0]?.date.slice(5)}</span>
                  <span>{daily[daily.length - 1]?.date.slice(5)}</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {events.length > 0 && (
                <div className="glass-card p-5 sm:p-7">
                  <p className="font-mono text-xs uppercase tracking-widest text-slate-500">Event counts</p>
                  <ul className="mt-3 divide-y divide-edge/40">
                    {events.map(([event, count]) => (
                      <li key={event} className="flex items-center justify-between py-2 text-sm">
                        <span className="text-slate-300">{eventLabel(event)}</span>
                        <span className="font-mono text-xs text-accent">{count.toLocaleString()}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {projects.length > 0 && (
                <div className="glass-card p-5 sm:p-7">
                  <p className="font-mono text-xs uppercase tracking-widest text-slate-500">Project engagement</p>
                  <ul className="mt-3 space-y-4">
                    {projects.map(([id, engagement]) => (
                      <li key={id}>
                        <p className="font-display text-sm font-semibold text-white">{projectNames[id] ?? id}</p>
                        <p className="mt-1 font-mono text-xs text-slate-400">
                          {engagement.clicks ?? 0} clicks · {engagement.previews ?? 0} previews · {engagement.case_studies ?? 0} case studies
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        );
      }}
    </Section>
  );
}

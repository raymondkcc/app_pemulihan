const TEACHER_RETURNS = ["/cikgu/mengajar", "/cikgu/panduan", "/cikgu/bahasa-melayu", "/cikgu/matematik"];

export function teacherReturnPath(params, subject = "bm") {
  const requested = params.get("returnTo");
  const path = TEACHER_RETURNS.includes(requested) ? requested : "/cikgu/mengajar";
  const routeSubject = path === "/cikgu/matematik" ? "math" : path === "/cikgu/bahasa-melayu" ? "bm" : subject === "math" ? "math" : "bm";
  return `${path}?subject=${routeSubject}`;
}

export function activityHref(path, { teacherMode = false, returnTo } = {}) {
  const url = new URL(path, "https://navigation.local");
  if (teacherMode) url.searchParams.set("mode", "teacher");
  if (returnTo) url.searchParams.set("returnTo", returnTo);
  return `${url.pathname}${url.search}${url.hash}`;
}

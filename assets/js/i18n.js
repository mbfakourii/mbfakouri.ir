export const messages = {
  en: {
    role: "Senior Developer",
    description: "I am a software developer that's very passionate about solving complicated problems and creating software solutions 🤖.\n\nI ❤️ Open Source and therefore take great pleasure out of working on interesting open-source projects. I enjoy sharing ideas, learning from the community, and turning complex challenges into simple, useful experiences.",
    github: "Explore my GitHub",
    footerName: "Mohammad Bagher Fakouri",
    lightTheme: "Switch to light theme",
    darkTheme: "Switch to dark theme",
    title: "Mohammad Bagher Fakouri — Developer",
  },
  fa: {
    role: "توسعه‌دهنده ارشد",
    description: "من یک توسعه‌دهنده نرم‌افزارم که به حل مسئله‌های پیچیده و ساخت راهکارهای نرم‌افزاری علاقه زیادی دارم 🤖.\n\nمن عاشق دنیای متن‌بازم ❤️ و از کار روی پروژه‌های متن‌باز جالب لذت می‌برم. به اشتراک گذاشتن ایده‌ها، یادگیری از جامعه توسعه‌دهندگان و تبدیل چالش‌های پیچیده به تجربه‌هایی ساده و کاربردی، برایم بخش جذاب این مسیر است.",
    github: "پروژه‌هایم در گیت‌هاب",
    footerName: "محمد باقر فکوری",
    lightTheme: "تغییر به پوسته روشن",
    darkTheme: "تغییر به پوسته تیره",
    title: "محمد باقر فکوری — توسعه‌دهنده نرم‌افزار",
  },
};

export function translateDocument(locale) {
  const dictionary = messages[locale] ?? messages.en;
  document.documentElement.lang = locale;
  document.documentElement.dir = locale === "fa" ? "rtl" : "ltr";
  document.title = dictionary.title;
  for (const element of document.querySelectorAll("[data-i18n]")) {
    element.textContent = dictionary[element.dataset.i18n];
  }
}

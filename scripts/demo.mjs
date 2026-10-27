// Fills the database with sample courses, students and payments so every screen can be seen full.
// Usage: npm run demo   (run once after `npm run db:migrate`; it skips if the sample courses exist)
// The sample lessons have no video links: open each lesson in Admin → Courses and paste yours.
import bcrypt from "bcryptjs";
import { prisma } from "./_prisma.mjs";

if (await prisma.course.findUnique({ where: { slug: "cell-biology-unit-of-life" } })) {
  console.log("Sample data already there.");
  process.exit(0);
}
const ago = (spec) => {
  const [n, unit] = spec.split(" ");
  const ms = { minutes: 60e3, hours: 3600e3, days: 86400e3 }[unit];
  return new Date(Date.now() - Number(n) * ms);
};

const courses = [
  {
    slug: "cell-biology-unit-of-life",
    title: "Cell Biology: The Unit of Life",
    subtitle: "From prokaryotes to mitosis, explained with clear diagrams.",
    description:
      "Everything in biology starts with the cell. This course builds the picture step by step: what cells are made of, how prokaryotic and eukaryotic cells differ, what each organelle does, and how cells divide.\n\nEvery lesson ends with a short quiz, and each one comes with notes you can download and revise from.",
    price: 1200,
    category: "Cell Biology",
    instructor: "Dr. Nusrat Jahan",
    level: "Beginner",
    language: "Bangla",
    lessons: [
      ["Welcome: how this course works", 6, 1, [["What opens the next lesson?", ["Passing this lesson’s quiz", "Waiting one day", "Watching the video twice"], 0, "Each lesson opens once you pass the quiz of the one before it."]]],
      ["Prokaryotic and eukaryotic cells", 16, 0, [
        ["Which of these cells has a true, membrane-bound nucleus?", ["A bacterium", "A yeast cell", "A cyanobacterium"], 1, "Yeast is a fungus, so its cells are eukaryotic."],
        ["Ribosomes in prokaryotic cells are…", ["70S", "80S", "90S"], 0, "Prokaryotes have 70S ribosomes; eukaryotic cytoplasm has 80S."],
      ]],
      ["Cell organelles and their jobs", 22, 0, [
        ["Which organelle makes most of the cell’s ATP by aerobic respiration?", ["Golgi body", "Mitochondrion", "Lysosome"], 1, ""],
        ["Where are proteins assembled?", ["Ribosomes", "Vacuoles", "Centrioles"], 0, ""],
      ]],
      ["The cell membrane", 14, 0, [["The fluid mosaic model describes…", ["the cell membrane", "the nucleus", "the cell wall"], 0, "Proteins float in a fluid phospholipid bilayer."]]],
      ["Mitosis and meiosis", 24, 0, [
        ["How many daughter cells does one meiosis produce?", ["2", "4", "8"], 1, ""],
        ["Crossing over happens during…", ["Prophase I of meiosis", "Metaphase of mitosis", "Telophase II of meiosis"], 0, ""],
      ]],
    ],
  },
  {
    slug: "human-physiology-heart-blood",
    title: "Human Physiology: Heart, Blood and Breathing",
    subtitle: "How your circulatory and respiratory systems keep you alive.",
    description:
      "Follow a drop of blood through the body: the heart’s four chambers, what blood is made of, and how the lungs swap oxygen for carbon dioxide.\n\nIncludes weekly live classes for questions, and labelled diagrams for every lesson.",
    price: 1800,
    comparePrice: 2200,
    category: "Human Physiology",
    instructor: "Rafiq Ahmed",
    level: "Intermediate",
    language: "Bangla and English",
    lessons: [
      ["Overview of the circulatory system", 10, 1, [["Which blood vessels carry blood away from the heart?", ["Veins", "Arteries", "Capillaries"], 1, ""]]],
      ["The human heart", 20, 0, [
        ["How many chambers does the human heart have?", ["2", "3", "4"], 2, "Two atria and two ventricles."],
        ["The heart’s natural pacemaker is the…", ["SA node", "AV node", "bundle of His"], 0, "The sinoatrial node starts each heartbeat."],
      ]],
      ["Blood and its components", 18, 0, [["Which blood cells carry oxygen?", ["White blood cells", "Red blood cells", "Platelets"], 1, "Haemoglobin in red blood cells binds oxygen."]]],
      ["The respiratory system", 17, 0, [["Gas exchange in the lungs happens in the…", ["bronchi", "alveoli", "trachea"], 1, ""]]],
      ["How breathing works", 12, 0, []],
    ],
  },
  {
    slug: "genetics-made-simple",
    title: "Genetics Made Simple",
    subtitle: "Mendel, Punnett squares and the structure of DNA.",
    description:
      "Learn to predict how traits are inherited. We start with Mendel’s experiments, solve monohybrid and dihybrid crosses step by step, and finish with the structure of DNA.",
    price: 1500,
    category: "Genetics",
    instructor: "Dr. Nusrat Jahan",
    level: "Intermediate",
    language: "Bangla",
    lessons: [
      ["Mendel and his pea plants", 15, 1, [["Mendel’s law of segregation says that…", ["the two alleles of a gene separate when gametes form", "genes are always inherited together", "dominant alleles destroy recessive ones"], 0, ""]]],
      ["Monohybrid crosses", 20, 0, [["Crossing two Tt plants gives which phenotype ratio?", ["1:1", "3:1", "9:3:3:1"], 1, "TT and Tt (3) show the dominant trait; tt (1) the recessive."]]],
      ["Dihybrid crosses", 22, 0, [["The classic dihybrid F2 phenotype ratio is…", ["9:3:3:1", "3:1", "1:2:1"], 0, ""]]],
      ["The structure of DNA", 18, 0, [
        ["In DNA, adenine pairs with…", ["guanine", "thymine", "uracil"], 1, "Uracil replaces thymine only in RNA."],
        ["The two strands of DNA run…", ["parallel", "antiparallel", "only in a circle"], 1, ""],
      ]],
    ],
  },
  {
    slug: "plant-biology-photosynthesis",
    title: "Plant Biology: Photosynthesis",
    subtitle: "A free short course on how plants turn light into food.",
    description: "Three short lessons on where photosynthesis happens, the light reactions and the Calvin cycle.",
    price: 0,
    category: "Plant Biology",
    instructor: "Rafiq Ahmed",
    level: "All levels",
    language: "Bangla",
    lessons: [
      ["What is photosynthesis?", 9, 1, [["Photosynthesis mainly happens in the…", ["mitochondria", "chloroplasts", "nucleus"], 1, ""]]],
      ["The light reactions", 14, 0, [["The light reactions release which gas?", ["Oxygen", "Carbon dioxide", "Nitrogen"], 0, "Oxygen comes from splitting water."]]],
      ["The Calvin cycle", 13, 0, []],
    ],
  },
];

const ids = {};
for (const [ci, c] of courses.entries()) {
  const created = ago(`${(courses.length - ci) * 3} days`);
  const course = await prisma.course.create({
    data: {
      slug: c.slug, title: c.title, subtitle: c.subtitle, description: c.description, price: c.price,
      comparePrice: c.comparePrice ?? 0, category: c.category ?? "", instructor: c.instructor ?? "",
      level: c.level, language: c.language, published: true, createdAt: created,
      lessons: {
        create: c.lessons.map(([title, durationMin, preview, qs], position) => ({
          title, durationMin, position, isPreview: !!preview, passPercent: 70,
          questions: {
            create: qs.map(([prompt, options, correctIndex, explanation], qi) => ({ prompt, options, correctIndex, explanation, position: qi })),
          },
        })),
      },
    },
    include: { lessons: { orderBy: { position: "asc" } } },
  });
  ids[c.slug] = { id: course.id, price: c.price, lessons: course.lessons.map((l) => l.id) };
}

// Sample students and payments, so the admin screens show a working day.
const passwordHash = bcrypt.hashSync("student123", 10);
const people = [
  ["Nusrat Jahan", "nusrat@example.com", "01812345678"],
  ["Tanvir Hasan", "tanvir@example.com", "01712004433"],
  ["Farhana Akter", "farhana@example.com", "01911223344"],
  ["Rafiul Islam", "rafiul@example.com", "01556677889"],
  ["Sadia Chowdhury", "sadia@example.com", "01399887766"],
];
const uid = {};
for (const [name, email, phone] of people) {
  const u = await prisma.user.upsert({
    where: { email }, update: {},
    create: { name, email, phone, passwordHash, createdAt: ago("12 days") },
  });
  uid[email] = u.id;
}
const list = [
  ["tanvir@example.com", "human-physiology-heart-blood", "01712004433", "8FH3K2LM9Q", "approved", "", "9 days", "9 days"],
  ["farhana@example.com", "cell-biology-unit-of-life", "01911223344", "7QW2E9RT4Y", "approved", "", "6 days", "6 days"],
  ["rafiul@example.com", "genetics-made-simple", "01556677889", "9ZX4C7VB2N", "approved", "", "3 days", "2 days"],
  ["sadia@example.com", "human-physiology-heart-blood", "01399887766", "6AS1D8FG3H", "rejected", "TrxID not found in our bKash statement.", "2 days", "1 days"],
  ["nusrat@example.com", "human-physiology-heart-blood", "01812345678", "9JK4R2X7PQ", "pending", "", "3 hours", null],
  ["sadia@example.com", "human-physiology-heart-blood", "01399887766", "5PL0K9JH8G", "pending", "", "40 minutes", null],
];
for (const [email, slug, sender, trx, status, note, created, reviewed] of list) {
  const c = ids[slug];
  const p = await prisma.payment.create({
    data: {
      userId: uid[email], courseId: c.id, amount: c.price, senderNumber: sender, trxId: trx, status,
      adminNote: note, createdAt: ago(created), reviewedAt: reviewed ? ago(reviewed) : null,
    },
  });
  if (status === "approved") {
    await prisma.enrollment.create({ data: { userId: uid[email], courseId: c.id, paymentId: p.id, createdAt: ago(reviewed) } });
  }
}
const progress = [
  ["tanvir@example.com", "human-physiology-heart-blood", 3, 8],
  ["farhana@example.com", "cell-biology-unit-of-life", 2, 4],
  ["rafiul@example.com", "genetics-made-simple", 1, 1],
];
for (const [email, slug, count, startDays] of progress) {
  for (const [i, lessonId] of ids[slug].lessons.slice(0, count).entries()) {
    await prisma.lessonProgress.create({
      data: { userId: uid[email], lessonId, score: 100, attempts: 1, completedAt: ago(`${startDays - i} days`) },
    });
  }
}

console.log("Sample courses, 5 students (password student123) and 6 payments added.");
console.log("Next: open Admin → Courses → each lesson, and paste the real video links.");
await prisma.$disconnect();

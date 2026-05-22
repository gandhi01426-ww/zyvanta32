import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Check, ChevronLeft, ChevronRight, Clock, GraduationCap, ShoppingBag, Sparkles, Star } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Course, ProductReview } from "@/data/catalog";
import { useCart } from "@/context/CartContext";
import { toast } from "@/hooks/use-toast";
import { inr, toInrAmount } from "@/lib/currency";
import { getCourses, getItemReviews } from "@/services/api";

const Stars = ({ value, size = 14 }: { value: number; size?: number }) => (
  <div className="inline-flex items-center gap-0.5">
    {Array.from({ length: 5 }).map((_, index) => (
      <Star key={index} style={{ width: size, height: size }} className={index < Math.round(value) ? "fill-gold text-gold" : "text-gold/30"} />
    ))}
  </div>
);

const CourseCard = ({ course, active, onSelect }: { course: Course; active: boolean; onSelect: (course: Course) => void }) => (
  <button
    type="button"
    onClick={() => onSelect(course)}
    className={`group text-left rounded-3xl overflow-hidden border transition-all focus:outline-none focus:ring-2 focus:ring-gold/60 ${active ? "border-gold shadow-gold bg-gold/5" : "glass gold-border hover:shadow-gold"}`}
  >
    <div className="relative aspect-[4/3] bg-noir-soft overflow-hidden">
      <img src={course.image || "/placeholder.svg"} alt={course.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
      <div className="absolute top-4 left-4 text-[10px] uppercase tracking-[0.25em] bg-gradient-gold text-noir px-3 py-1 rounded-full font-bold">
        Course
      </div>
    </div>
    <div className="p-5">
      <h3 className="font-display text-xl truncate">{course.name}</h3>
      <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{course.title}</p>
      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="text-gold-gradient text-xl font-bold">{inr(course.price)}</span>
        <span className="text-xs text-muted-foreground inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {course.duration}</span>
      </div>
    </div>
  </button>
);

const CourseDetail = ({ course }: { course: Course }) => {
  const { add, openCheckout } = useCart();
  const gallery = course.gallery?.length ? course.gallery : [course.image || "/placeholder.svg"];
  const [slide, setSlide] = useState(0);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  useEffect(() => {
    setSlide(0);
    if (gallery.length <= 1) return;
    const timer = setInterval(() => setSlide((current) => (current + 1) % gallery.length), 3500);
    return () => clearInterval(timer);
  }, [course.id, gallery.length]);

  useEffect(() => {
    let mounted = true;
    setReviewsLoading(true);
    getItemReviews({ item_code: course.code, item_id: course.id, item_type: "course" })
      .then((nextReviews) => mounted && setReviews(nextReviews))
      .finally(() => mounted && setReviewsLoading(false));
    return () => {
      mounted = false;
    };
  }, [course.code, course.id]);

  const addCourse = (checkout = false) => {
    add({
      id: course.id,
      name: course.name,
      price: toInrAmount(course.price),
      img: course.image || "/placeholder.svg",
      item_type: "course",
      allow_pay_now: course.allow_pay_now !== false,
      allow_cod: course.allow_cod === true,
    });
    toast({ title: "Course added", description: `${course.name} is in your bag.` });
    if (checkout) openCheckout();
  };

  return (
    <div className="glass gold-border rounded-3xl overflow-hidden shadow-elite">
      <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
        <div className="relative min-h-[360px] lg:min-h-[620px] bg-noir-soft overflow-hidden">
          <div className="absolute inset-0 bg-radial-gold opacity-60" />
          {gallery.map((src, index) => (
            <img key={`${src}-${index}`} src={src} alt={`${course.name} ${index + 1}`} className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${index === slide ? "opacity-100" : "opacity-0"}`} />
          ))}
          {gallery.length > 1 && (
            <>
              <button onClick={() => setSlide((current) => (current - 1 + gallery.length) % gallery.length)} aria-label="Previous course image" className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full glass gold-border grid place-items-center text-gold">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => setSlide((current) => (current + 1) % gallery.length)} aria-label="Next course image" className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full glass gold-border grid place-items-center text-gold">
                <ChevronRight className="w-4 h-4" />
              </button>
              <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2">
                {gallery.map((_, index) => (
                  <button key={index} onClick={() => setSlide(index)} aria-label={`Go to course image ${index + 1}`} className={`h-2 rounded-full transition-all ${index === slide ? "w-8 bg-gold" : "w-2 bg-gold/35"}`} />
                ))}
              </div>
            </>
          )}
        </div>

        <div className="p-7 md:p-9 flex flex-col">
          <div className="text-[10px] uppercase tracking-[0.4em] text-gold inline-flex items-center gap-2">
            <GraduationCap className="w-3.5 h-3.5" /> Zyvanta Academy
          </div>
          <h1 className="font-display text-3xl md:text-5xl mt-3">{course.name}</h1>
          <p className="mt-2 text-lg text-muted-foreground">{course.title}</p>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <span className="text-3xl font-bold text-gold-gradient">{inr(course.price)}</span>
            <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground"><Clock className="w-4 h-4 text-gold" /> {course.duration}</span>
            <span className="inline-flex items-center gap-2 text-sm">
              <Stars value={course.rating} />
              {course.rating.toFixed(1)} ({course.review_count.toLocaleString()} reviews)
            </span>
          </div>
          <p className="mt-6 text-sm leading-relaxed text-muted-foreground">{course.description}</p>

          <div className="mt-7 grid sm:grid-cols-2 gap-3 text-sm">
            {["Step-by-step lessons", "Practical business workflows", "Mobile-friendly access", "Lifetime reference material"].map((item) => (
              <div key={item} className="flex items-start gap-2">
                <span className="mt-0.5 w-5 h-5 rounded-full bg-gradient-gold grid place-items-center shrink-0">
                  <Check className="w-3 h-3 text-noir" strokeWidth={3} />
                </span>
                <span>{item}</span>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <button onClick={() => addCourse()} className="flex-1 glass gold-border text-gold rounded-full py-3 text-xs uppercase tracking-widest font-bold inline-flex items-center justify-center gap-2">
              <ShoppingBag className="w-4 h-4" /> Add Course
            </button>
            <button onClick={() => addCourse(true)} className="flex-1 bg-gradient-gold text-noir rounded-full py-3 text-xs uppercase tracking-widest font-bold shadow-gold">
              Buy Course
            </button>
          </div>

          <div className="mt-9 pt-7 border-t border-gold/20">
            <h2 className="font-display text-2xl mb-4 inline-flex items-center gap-2">
              <Star className="w-5 h-5 text-gold fill-gold" /> Course Reviews
            </h2>
            {reviewsLoading && <div className="text-sm text-muted-foreground">Loading reviews...</div>}
            {!reviewsLoading && reviews.length === 0 && (
              <div className="rounded-2xl border border-gold/25 p-4 text-sm text-muted-foreground">
                Verified reviews for this course will appear here soon.
              </div>
            )}
            {!reviewsLoading && reviews.length > 0 && (
              <div className="grid sm:grid-cols-2 gap-3">
                {reviews.slice(0, 4).map((review, index) => (
                  <div key={review.id || `${review.name}-${index}`} className="rounded-2xl border border-gold/25 p-4">
                    <Stars value={review.rating} size={12} />
                    <p className="mt-2 text-sm text-muted-foreground">"{review.comment}"</p>
                    <div className="mt-3 text-sm font-bold text-gold-gradient">{review.name}</div>
                    {review.role && <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{review.role}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const Courses = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [sellingEnabled, setSellingEnabled] = useState(true);
  const [active, setActive] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);

  const selectCourse = (course: Course) => {
    setActive(course);
    window.setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 0);
  };

  useEffect(() => {
    let mounted = true;
    getCourses()
      .then(({ courses: nextCourses, selling_enabled }) => {
        if (!mounted) return;
        setCourses(nextCourses);
        setSellingEnabled(selling_enabled);
        setActive(nextCourses[0] || null);
      })
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <section className="relative pt-28 pb-20 overflow-hidden">
        <div className="absolute inset-0 grid-bg pointer-events-none" />
        <div className="absolute -top-24 right-0 w-[520px] h-[520px] bg-radial-gold blur-3xl pointer-events-none" />
        <div className="container relative">
          <Link to="/" className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-gold hover:opacity-80 mb-8">
            <ChevronLeft className="w-4 h-4" /> Back Home
          </Link>

          <div className="max-w-3xl mb-12">
            <span className="text-xs uppercase tracking-[0.4em] text-gold inline-flex items-center gap-2">
              <Sparkles className="w-3 h-3" /> Zyvanta Academy
            </span>
            <h1 className="font-display text-4xl md:text-6xl mt-3">Courses</h1>
            <p className="mt-4 text-muted-foreground">Focused lessons for building sharper digital products, stores, content systems, and lean business workflows.</p>
          </div>

          {loading && <div className="glass gold-border rounded-3xl p-8 text-center text-muted-foreground">Loading courses...</div>}

          {!loading && !sellingEnabled && (
            <div className="glass gold-border rounded-3xl p-8 text-center">
              <BookOpen className="w-10 h-10 text-gold mx-auto" />
              <div className="font-display text-2xl mt-3">Courses are paused</div>
              <p className="text-sm text-muted-foreground mt-2">New course enrollments are currently unavailable.</p>
            </div>
          )}

          {!loading && sellingEnabled && courses.length === 0 && (
            <div className="glass gold-border rounded-3xl p-8 text-center">
              <BookOpen className="w-10 h-10 text-gold mx-auto" />
              <div className="font-display text-2xl mt-3">No courses live yet</div>
              <p className="text-sm text-muted-foreground mt-2">Courses will appear here when they are available.</p>
            </div>
          )}

          {!loading && sellingEnabled && courses.length > 0 && (
            <div className="space-y-8">
              {active && <CourseDetail course={active} />}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((course) => (
                  <CourseCard key={course.id} course={course} active={active?.id === course.id} onSelect={selectCourse} />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
};

export default Courses;

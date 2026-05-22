import { useEffect, useState } from "react";
import { Bot, Clock, GraduationCap, Megaphone, ShoppingBag, Sparkles, Star, TrendingUp, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Course } from "@/data/catalog";
import { getCourses } from "@/services/api";
import { useCart } from "@/context/CartContext";
import { toast } from "@/hooks/use-toast";
import { inr, toInrAmount } from "@/lib/currency";

interface Props {
  open: boolean;
  onClose: () => void;
}

const icons = [TrendingUp, Megaphone, Bot, GraduationCap];

const Stars = ({ value }: { value: number }) => (
  <span className="inline-flex items-center gap-0.5">
    {Array.from({ length: 5 }).map((_, index) => (
      <Star key={index} className={`w-3.5 h-3.5 ${index < Math.round(value) ? "fill-gold text-gold" : "text-gold/30"}`} />
    ))}
  </span>
);

const CoursesDialog = ({ open, onClose }: Props) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [sellingEnabled, setSellingEnabled] = useState(true);
  const [active, setActive] = useState<Course | null>(null);
  const { add, openCheckout } = useCart();

  useEffect(() => {
    if (!open) return;
    getCourses().then(({ courses: nextCourses, selling_enabled }) => {
      setCourses(nextCourses);
      setSellingEnabled(selling_enabled);
      setActive(nextCourses[0] || null);
    });
  }, [open]);

  const buyCourse = (course: Course, checkout = false) => {
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
    if (checkout) {
      onClose();
      openCheckout();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="max-w-5xl p-0 overflow-hidden glass gold-border border-0 sm:rounded-3xl shadow-elite max-h-[90vh] overflow-y-auto [&>button]:hidden">
        <div className="p-6 md:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.4em] text-gold">
                <Sparkles className="w-3 h-3" /> Zyvanta Academy
              </div>
              <DialogTitle className="font-display text-3xl md:text-4xl mt-2 inline-flex items-center gap-3">
                <GraduationCap className="w-7 h-7 text-gold" /> Courses
              </DialogTitle>
              <DialogDescription className="mt-2 text-sm text-muted-foreground max-w-xl">
                Select a course to view title, description, reviews, price and duration.
              </DialogDescription>
            </div>
            <button onClick={onClose} aria-label="Close courses" className="w-9 h-9 rounded-full glass gold-border grid place-items-center text-gold">
              <X className="w-4 h-4" />
            </button>
          </div>

          {!sellingEnabled ? (
            <div className="mt-8 rounded-2xl border border-gold/30 p-6 text-center">
              <div className="font-display text-2xl">Courses are paused</div>
              <p className="text-sm text-muted-foreground mt-2">Course selling is currently turned off by admin.</p>
            </div>
          ) : courses.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-gold/30 p-6 text-center">
              <div className="font-display text-2xl">No courses live yet</div>
              <p className="text-sm text-muted-foreground mt-2">Add or resume a course from the admin panel to show it here.</p>
            </div>
          ) : (
            <div className="grid lg:grid-cols-[1fr_1.15fr] gap-5 mt-7">
              <div className="space-y-3">
                {courses.map((course, index) => {
                  const Icon = icons[index % icons.length];
                  const selected = active?.id === course.id;
                  return (
                    <button
                      key={course.id}
                      type="button"
                      onClick={() => setActive(course)}
                      className={`w-full text-left rounded-2xl p-4 border transition-all ${selected ? "bg-gradient-gold text-noir border-gold shadow-gold" : "glass gold-border hover:shadow-gold"}`}
                    >
                      <div className="flex items-start gap-3">
                        <span className={`w-11 h-11 rounded-full grid place-items-center shrink-0 ${selected ? "bg-noir/10" : "bg-gradient-gold"}`}>
                          <Icon className="w-5 h-5 text-noir" />
                        </span>
                        <span className="min-w-0">
                          <span className="block font-display text-lg truncate">{course.name}</span>
                          <span className={`block text-xs mt-0.5 ${selected ? "text-noir/70" : "text-muted-foreground"}`}>{course.title}</span>
                          <span className="mt-2 inline-flex items-center gap-3 text-xs">
                            <span>{inr(course.price)}</span>
                            <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" /> {course.duration}</span>
                          </span>
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {active && (
                <div className="glass gold-border rounded-3xl overflow-hidden">
                  <div className="relative aspect-[16/9] bg-noir-soft overflow-hidden">
                    <img src={active.image || "/placeholder.svg"} alt={active.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                    <div className="absolute left-5 bottom-5 right-5">
                      <div className="text-[10px] uppercase tracking-[0.35em] text-gold">Featured Course</div>
                      <h3 className="font-display text-2xl md:text-3xl mt-1">{active.name}</h3>
                    </div>
                  </div>
                  <div className="p-5 md:p-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="text-sm text-muted-foreground">{active.title}</div>
                        <div className="mt-1 inline-flex items-center gap-2 text-sm">
                          <Stars value={active.rating} />
                          <span>{active.rating.toFixed(1)} ({active.review_count.toLocaleString()} reviews)</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-gold-gradient">{inr(active.price)}</div>
                        <div className="text-xs text-muted-foreground inline-flex items-center gap-1"><Clock className="w-3 h-3" /> {active.duration}</div>
                      </div>
                    </div>
                    <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{active.description}</p>
                    <div className="mt-5 flex flex-col sm:flex-row gap-3">
                      <button onClick={() => buyCourse(active)} className="flex-1 glass gold-border text-gold rounded-full py-3 text-xs uppercase tracking-widest font-bold inline-flex items-center justify-center gap-2">
                        <ShoppingBag className="w-4 h-4" /> Add Course
                      </button>
                      <button onClick={() => buyCourse(active, true)} className="flex-1 bg-gradient-gold text-noir rounded-full py-3 text-xs uppercase tracking-widest font-bold shadow-gold">
                        Buy Course
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CoursesDialog;

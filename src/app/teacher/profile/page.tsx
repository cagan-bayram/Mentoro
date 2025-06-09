"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const profileFormSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  bio: z.string().optional(),
  education: z.string().optional(),
  experience: z.string().optional(),
  expertise: z.string().optional(), // Will be parsed into array later
  hourlyRate: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z.number().optional()
  ),
  image: z.string().optional(),
});

type ProfileForm = z.infer<typeof profileFormSchema>;

interface UserProfileData {
  id: string;
  name?: string | null;
  email: string;
  bio?: string | null;
  education?: string | null;
  experience?: string | null;
  expertise: string[];
  hourlyRate?: number | null;
  image?: string | null;
  role: "STUDENT" | "TEACHER" | "ADMIN";
}

export default function TeacherProfilePage() {
  const router = useRouter();
  const { data: session, status, update } = useSession();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: "",
      bio: "",
      education: "",
      experience: "",
      expertise: "",
      hourlyRate: undefined,
      image: "",
    },
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }

    if (status === "authenticated" && session.user?.role !== "TEACHER") {
      router.push("/dashboard"); // Redirect non-teachers
      return;
    }

    if (status === "authenticated" && session.user?.id) {
      const fetchProfile = async () => {
        try {
          const response = await fetch(`/api/users/${session.user?.id}`);
          if (!response.ok) {
            throw new Error("Failed to fetch profile");
          }
          const data: UserProfileData = await response.json();
          // Convert expertise array to comma-separated string for the form
          reset({
            name: data.name ?? undefined,
            bio: data.bio ?? undefined,
            education: data.education ?? undefined,
            experience: data.experience ?? undefined,
            expertise: data.expertise ? data.expertise.join(", ") : undefined,
            hourlyRate: data.hourlyRate ?? undefined,
            image: data.image ?? undefined,
          });
        } catch (err) {
          if (err instanceof Error) {
            setError(err.message);
          } else {
            setError("An unexpected error occurred.");
          }
        } finally {
          setLoading(false);
        }
      };

      fetchProfile();
    } else if (status === "authenticated" && !session.user?.id) {
      // This case handles if session.user.id is somehow null or undefined after authentication
      setError("User ID not found in session.");
      setLoading(false);
    }
  }, [session, status, router, reset]);

  const onSubmit = async (data: ProfileForm) => {
    try {
      // Convert expertise string back to array for API
      const expertiseArray = data.expertise
        ?.split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const updatedData = {
        ...data,
        expertise: expertiseArray,
      };

      const response = await fetch(`/api/users/${session?.user?.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update profile");
      }

      // Update session to reflect new user data
      await update({
        name: data.name,
        // Add other updated fields to session if needed for immediate UI reflection
      });

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred.");
      }
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <h2 className="text-2xl font-semibold">Loading profile...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <h2 className="text-2xl font-semibold text-red-600">Error: {error}</h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-lg space-y-8 p-8 bg-white rounded-lg shadow-md">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Edit Your Profile
          </h2>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Full Name
            </label>
            <input
              {...register("name")}
              type="text"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="Your Name"
            />
            {errors.name && (
              <p className="mt-2 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
              Bio
            </label>
            <textarea
              {...register("bio")}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="Tell us about yourself..."
            ></textarea>
            {errors.bio && (
              <p className="mt-2 text-sm text-red-600">{errors.bio.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="education" className="block text-sm font-medium text-gray-700">
              Education
            </label>
            <input
              {...register("education")}
              type="text"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="e.g., PhD in Mathematics, University of XYZ"
            />
            {errors.education && (
              <p className="mt-2 text-sm text-red-600">{errors.education.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="experience" className="block text-sm font-medium text-gray-700">
              Experience
            </label>
            <input
              {...register("experience")}
              type="text"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="e.g., 5 years as a High School Teacher"
            />
            {errors.experience && (
              <p className="mt-2 text-sm text-red-600">{errors.experience.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="expertise" className="block text-sm font-medium text-gray-700">
              Expertise (comma-separated)
            </label>
            <input
              {...register("expertise")}
              type="text"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="e.g., Algebra, Geometry, Calculus, Physics"
            />
            {errors.expertise && (
              <p className="mt-2 text-sm text-red-600">{errors.expertise.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="hourlyRate" className="block text-sm font-medium text-gray-700">
              Hourly Rate (for 1-to-1 lessons, optional)
            </label>
            <input
              {...register("hourlyRate")}
              type="number"
              step="0.01"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="0.00"
            />
            {errors.hourlyRate && (
              <p className="mt-2 text-sm text-red-600">{errors.hourlyRate.message}</p>
            )}
          </div>

          {/* Image upload will be handled later */}
          {/* <div>
            <label htmlFor="image" className="block text-sm font-medium text-gray-700">
              Profile Image URL
            </label>
            <input
              {...register("image")}
              type="text"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="https://example.com/your-image.jpg"
            />
            {errors.image && (
              <p className="mt-2 text-sm text-red-600">{errors.image.message}</p>
            )}
          </div> */}

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">{error}</h3>
                </div>
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative flex w-full justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Saving Profile..." : "Save Profile"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 
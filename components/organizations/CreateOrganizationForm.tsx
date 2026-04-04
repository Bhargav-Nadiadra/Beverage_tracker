'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createOrganizationSchema, type CreateOrganizationInput } from '@/lib/validations';
import { generateSlug, isValidSlug } from '@/lib/slug';

export default function CreateOrganizationForm() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
    const [isCheckingSlug, setIsCheckingSlug] = useState(false);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<CreateOrganizationInput>({
        resolver: zodResolver(createOrganizationSchema),
        mode: 'onChange',
    });

    const name = watch('name');
    const slug = watch('slug');

    // Auto-generate slug when name changes (basic implementation)
    useEffect(() => {
        if (name && !slug) {
            setValue('slug', generateSlug(name));
        }
    }, [name, slug, setValue]);

    // Check slug availability with debounce
    useEffect(() => {
        if (!slug || !isValidSlug(slug)) {
            setSlugAvailable(null);
            return;
        }

        const checkAvailability = async () => {
            setIsCheckingSlug(true);
            try {
                const response = await fetch(`/api/organizations/check-slug?slug=${slug}`);
                const data = await response.json();
                setSlugAvailable(data.available);
            } catch (err) {
                console.error('Slug check failed', err);
                setSlugAvailable(null);
            } finally {
                setIsCheckingSlug(false);
            }
        };

        const timeoutId = setTimeout(checkAvailability, 500);
        return () => clearTimeout(timeoutId);
    }, [slug]);

    const onSubmit = async (data: CreateOrganizationInput) => {
        if (slugAvailable === false) {
            setError('This URL is already taken. Please choose another one.');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/organizations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to create organization');
            }

            // Successful creation
            router.push('/dashboard');
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-lg mx-auto p-8 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-transparent dark:border-gray-800">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Create Organization</h1>
                <p className="text-gray-600 dark:text-gray-400">Start tracking beverages for your team</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Organization Name Field */}
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Organization Name
                    </label>
                    <input
                        id="name"
                        type="text"
                        {...register('name')}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                        placeholder="e.g. Acme Corp"
                        disabled={isLoading}
                    />
                    {errors.name && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name.message}</p>
                    )}
                </div>

                {/* Slug Field */}
                <div>
                    <label htmlFor="slug" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Organization URL (Slug)
                    </label>
                    <div className="flex rounded-md shadow-sm">
                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 text-sm">
                            YOUR-APP.com/
                        </span>
                        <input
                            id="slug"
                            type="text"
                            {...register('slug')}
                            className={`flex-1 min-w-0 block w-full px-4 py-2 border bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-r-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition ${slugAvailable === false ? 'border-red-300 dark:border-red-700 focus:ring-red-500' :
                                    slugAvailable === true ? 'border-green-300 dark:border-green-700 focus:ring-green-500' : 'border-gray-300 dark:border-gray-700'
                                }`}
                            placeholder="acme-corp"
                            disabled={isLoading}
                        />
                    </div>

                    <div className="mt-1 flex items-center justify-between min-h-[20px]">
                        {errors.slug ? (
                            <p className="text-sm text-red-600 dark:text-red-400">{errors.slug.message}</p>
                        ) : isCheckingSlug ? (
                            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500 dark:text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Checking availability...
                            </p>
                        ) : slug && slugAvailable === true ? (
                            <p className="text-sm text-green-600 dark:text-green-500 flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Available
                            </p>
                        ) : slug && slugAvailable === false ? (
                            <p className="text-sm text-red-600 dark:text-red-400">This URL is already taken.</p>
                        ) : null}
                        <p className="text-xs text-gray-400 dark:text-gray-500 text-right ml-auto">
                            Lowercase letters, numbers, and hyphens only.
                        </p>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                    </div>
                )}

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={isLoading || slugAvailable === false}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                    {isLoading ? 'Creating Organization...' : 'Create Organization'}
                </button>
            </form>
        </div>
    );
}

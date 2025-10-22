import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../../lib/storage';
import { requireCompanion } from '../../lib/auth';
import { handleCors, validateMethod, handleError, sanitizeInput } from '../../lib/utils';

/**
 * PUT /api/companions/profile
 * Updates the current companion's profile
 * Requires: Companion authentication
 * 
 * Body:
 * - name?: string
 * - bio?: string
 * - age?: number
 * - location?: string
 * - hourlyRate?: number
 * - category?: string
 * - languages?: string[]
 * - interests?: string[]
 * 
 * Returns:
 * - 200: { message, companion }
 * - 401: { message } - Unauthorized
 * - 403: { message } - Not a companion
 * - 404: { message } - Profile not found
 * - 500: { message } - Server error
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS
  if (handleCors(req, res)) return;

  // Validate method
  if (!validateMethod(req, res, 'PUT')) return;

  try {
    // Require companion authentication
    const user = await requireCompanion(req, res);
    if (!user) return;

    const companion = await storage.getCompanionByUserId(user.userId);
    if (!companion) {
      return res.status(404).json({ message: 'Companion profile not found' });
    }

    const { name, bio, age, location, hourlyRate, category, languages, interests } = req.body;

    // Prepare update data
    const updateData: any = {};
    if (name !== undefined) updateData.name = sanitizeInput(name);
    if (bio !== undefined) updateData.bio = sanitizeInput(bio);
    if (age !== undefined) updateData.age = age;
    if (location !== undefined) updateData.location = sanitizeInput(location);
    if (hourlyRate !== undefined) updateData.hourlyRate = hourlyRate.toString();
    if (category !== undefined) updateData.category = category;
    if (languages !== undefined) updateData.languages = languages;
    if (interests !== undefined) updateData.interests = interests;

    // Update companion profile
    const updatedCompanion = await storage.updateCompanion(companion.id, updateData);

    return res.status(200).json({
      message: 'Profile updated successfully',
      companion: updatedCompanion,
    });
  } catch (error: any) {
    handleError(res, error, 'Update companion profile');
  }
}

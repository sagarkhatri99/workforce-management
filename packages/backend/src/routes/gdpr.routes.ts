import { Router } from 'express';
import prisma from '../utils/prisma';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

// Request DSR (Data Subject Request)
router.post('/request', async (req, res) => {
  try {
    const { type } = req.body;
    const userId = req.user!.userId;

    const request = await prisma.dSRRequest.create({
      data: {
        userId,
        type: type || 'ACCESS',
        status: 'PENDING',
      },
    });

    res.status(201).json(request);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get User Data (Access Request)
router.get('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        if (req.user!.userId !== userId && req.user!.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { shifts: true, clocks: true }
        });

        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Delete User Data (Erasure Request)
router.delete('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
         if (req.user!.userId !== userId && req.user!.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        // Anonymize user instead of hard delete to keep integrity if needed, or hard delete
        // GDPR allows keeping data for legal obligations (payroll).
        // Here we'll just soft delete / anonymize PII
        await prisma.user.update({
            where: { id: userId },
            data: {
                email: `deleted_${userId}@anonymized.com`,
                name: 'Anonymized User',
                password: 'deleted',
            }
        });

        res.json({ message: 'User data erased/anonymized' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

export default router;

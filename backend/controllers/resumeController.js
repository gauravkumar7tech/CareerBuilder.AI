import { parseResume } from '../utils/parseResume.js';

export const uploadResume = async (req, res) => {
  const fileBuffer = req.file.buffer;
  const resumeText = await parseResume(fileBuffer);
  res.json({ resumeText });
};

import { validationResult } from 'express-validator'
import Contact from '../models/Contact.js'

export const submitContact = async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const contact = await Contact.create(req.body)
  res.status(201).json(contact)
}

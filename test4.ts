import axios from 'axios';
import prisma from './src/config/database';
import { generateToken } from './src/config/jwt';

async function testHttp() {
  try {
    const user = await prisma.user.findFirst({ where: { role: 'penilai' }, include: { roles: true } });
    if (!user) return console.log('no user');

    const token = generateToken({
      sub: Number(user.id),
      email: user.email,
      roles: ['penilai'],
      teacher_id: Number(user.teacher_id),
      is_default_password: false
    });

    const s = await prisma.supervision.findFirst({
      where: { status: { in: ['TERJADWAL', 'DRAFT'] }, supervisor_id: user.teacher_id }
    });

    if (!s) return console.log('no schedule');

    console.log('Testing PUT /api/supervisions/' + s.id + '/draft');

    const res = await axios.put('http://localhost:3000/api/supervisions/' + s.id + '/draft', {
      items: [ { supervision_item_id: 106, score: null, note: null } ],
      strength_note: null,
      improvement_note: null,
      conclusion_note: null
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('HTTP SUCCESS', res.status);
  } catch (e: any) {
    console.error('HTTP ERROR', e.response?.data || e.message);
  }
}
testHttp();

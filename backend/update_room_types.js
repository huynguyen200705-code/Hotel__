const { poolPromise } = require('./db');

async function updateRoomTypes() {
  const pool = await poolPromise;
  await pool.request().query(`
    UPDATE RoomTypes SET type_name = N'Tiêu chuẩn', description = N'Phòng tiện nghi tiêu chuẩn' WHERE id = 1;
    UPDATE RoomTypes SET type_name = N'Cao cấp', description = N'Phòng cao cấp đầy đủ tiện ích' WHERE id = 2;
    UPDATE RoomTypes SET type_name = N'Sang trọng', description = N'Phòng sang trọng view đẹp' WHERE id = 3;
    UPDATE RoomTypes SET type_name = N'Thượng hạng', description = N'Phòng tổng thống, thượng hạng bậc nhất' WHERE id = 4;
  `);
  console.log('Successfully updated RoomTypes to 100% Vietnamese!');
  process.exit(0);
}

updateRoomTypes().catch(err => {
  console.error(err);
  process.exit(1);
});

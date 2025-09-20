import sequelize from "../config/db.js";
import PDFDocument from "pdfkit";
const ALLOWED = ["PENDING","PAID","SHIPPED","CANCELLED"];
function buildWhere({status, from, to}){
  const where = [];
  const params = [];
  if(status && ALLOWED.includes(status)){ where.push("status = ?"); params.push(status); }
  if(from){ where.push("created_at >= ?"); params.push(from+" 00:00:00"); }
  if(to){ where.push("created_at <= ?"); params.push(to+" 23:59:59"); }
  const sql = where.length ? ("WHERE "+where.join(" AND ")) : "";
  return {sql, params};
}
export async function listOrders(req,res){
  try{
    const page = Math.max(parseInt(req.query.page||"1",10),1);
    const limit = Math.min(Math.max(parseInt(req.query.limit||"20",10),1),100);
    const offset = (page-1)*limit;
    const {sql, params} = buildWhere({status:req.query.status, from:req.query.from, to:req.query.to});
    const [rows] = await sequelize.query(
      `SELECT id, status, created_at, updated_at FROM `Orders` ${sql} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      {replacements:[...params, limit, offset]}
    );
    const [[{cnt}]] = await sequelize.query(
      `SELECT COUNT(1) AS cnt FROM `Orders` ${sql}`,
      {replacements:params}
    );
    return res.json({ data: rows, meta:{ page, limit, total: Number(cnt) } });
  }catch(e){
    return res.status(500).json({error:"server_error"});
  }
}
export async function updateOrderStatus(req,res){
  try{
    const id = parseInt(req.params.id,10);
    const next = String(req.body?.status||"").toUpperCase();
    if(!ALLOWED.includes(next)) return res.status(400).json({error:"invalid_status"});
    const [[prev]] = await sequelize.query("SELECT id, status FROM `Orders` WHERE id=?", {replacements:[id]});
    if(!prev) return res.status(404).json({error:"order_not_found"});
    await sequelize.query(
      "UPDATE `Orders` SET status=?, status_updated_by=?, status_updated_at=NOW(), updated_at=NOW() WHERE id=?",
      {replacements:[next, req.user?.id||null, id]}
    );
    await sequelize.query(
      "INSERT INTO `OrderStatusHistory`(order_id, old_status, new_status, updated_by, updated_at) VALUES (?,?,?,?,NOW())",
      {replacements:[id, prev.status, next, req.user?.id||null]}
    );
    const [[after]] = await sequelize.query("SELECT id, status, status_updated_by, status_updated_at FROM `Orders` WHERE id=?", {replacements:[id]});
    return res.json({ ok:true, order: after });
  }catch(e){
    return res.status(500).json({error:"server_error"});
  }
}
export async function exportOrdersCsv(req,res){
  try{
    const {sql, params} = buildWhere({status:req.query.status, from:req.query.from, to:req.query.to});
    const [rows] = await sequelize.query(
      `SELECT id, status, DATE_FORMAT(created_at,'%Y-%m-%d %H:%i:%s') AS created_at, DATE_FORMAT(updated_at,'%Y-%m-%d %H:%i:%s') AS updated_at FROM `Orders` ${sql} ORDER BY created_at DESC`,
      {replacements:params}
    );
    const header = ["id","status","created_at","updated_at"];
    const lines = [header.join(",")].concat(rows.map(r=>[r.id,r.status,r.created_at,r.updated_at].join(",")));
    const csv = lines.join("\n");
    res.setHeader("content-type","text/csv; charset=utf-8");
    res.setHeader("content-disposition","attachment; filename=\"orders.csv\"");
    return res.send(csv);
  }catch(e){
    return res.status(500).json({error:"server_error"});
  }
}
export async function exportOrdersPdf(req,res){
  try{
    const {sql, params} = buildWhere({status:req.query.status, from:req.query.from, to:req.query.to});
    const [rows] = await sequelize.query(
      `SELECT id, status, DATE_FORMAT(created_at,'%Y-%m-%d %H:%i') AS created_at, DATE_FORMAT(updated_at,'%Y-%m-%d %H:%i') AS updated_at FROM `Orders` ${sql} ORDER BY created_at DESC`,
      {replacements:params}
    );
    res.setHeader("content-type","application/pdf");
    res.setHeader("content-disposition","attachment; filename=\"orders.pdf\"");
    const doc = new PDFDocument({margin:36});
    doc.pipe(res);
    doc.fontSize(16).text("Orders", {align:"left"});
    doc.moveDown(0.5);
    const col = [50,140,260,380];
    doc.fontSize(12).text("ID",col[0], doc.y);
    doc.text("STATUS",col[1], doc.y);
    doc.text("CREATED",col[2], doc.y);
    doc.text("UPDATED",col[3], doc.y);
    doc.moveDown(0.2); doc.moveTo(36, doc.y).lineTo(576-36, doc.y).stroke();
    rows.forEach(r=>{
      doc.moveDown(0.2);
      const y = doc.y;
      doc.text(String(r.id),col[0], y);
      doc.text(String(r.status),col[1], y);
      doc.text(String(r.created_at),col[2], y);
      doc.text(String(r.updated_at),col[3], y);
    });
    doc.end();
  }catch(e){
    return res.status(500).json({error:"server_error"});
  }
}

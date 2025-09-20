import jwt from "jsonwebtoken";

export function requireAuth(roles = []) {
  return (req, res, next) => {
    try {
      const header = req.headers.authorization || "";
      const [scheme, token] = header.split(" ");
      if (scheme?.toLowerCase() !== "bearer" || !token) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "change_me");
      req.user = { id: decoded.sub, email: decoded.email, role: decoded.role || "client" };
      if (roles.length && !roles.includes(req.user.role)) {
        return res.status(403).json({ error: "Forbidden" });
      }
      next();
    } catch {
      return res.status(401).json({ error: "Unauthorized" });
    }
  };
}

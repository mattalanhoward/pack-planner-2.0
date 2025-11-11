// import React, { useState, useEffect } from "react";
// import { useParams } from "react-router-dom";
// import GearListView from "./GearListView";
// import api from "../services/api";

// export default function SharedView() {
//   const { token } = useParams();
//   const [listId, setListId] = useState(null);
//   const [error, setError] = useState();

//   useEffect(() => {
//     api
//       .get(`/dashboard/share/${token}`)
//       .then(({ data }) => setListId(data.listId))
//       .catch(() => setError("This list isn’t available."));
//   }, [token]);

//   if (error) return <div className="p-4">{error}</div>;
//   if (!listId) return <div className="p-4">Loading…</div>;

//   // 2) Render GearListView in “readOnly” mode
//   return <GearListView listId={listId} readOnly />;
// }

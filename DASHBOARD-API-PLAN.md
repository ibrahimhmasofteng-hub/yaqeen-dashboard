# Dashboard Backend Requirements (Yaqeen)

## Endpoint
```
GET /api/v1/dashboard/summary
```

## Response
```
{
  "summary": {
    "studentsTotal": 1284,
    "studentsDeltaMonth": 42,
    "teachersTotal": 84,
    "teachersDeltaMonth": 6,
    "coursesTotal": 26,
    "coursesDeltaMonth": 3,
    "groupsTotal": 58,
    "groupsDeltaMonth": 8
  },
  "recentRegistrations": [
    { "id": "uuid", "name": "Ahmad Saleh", "role": "STUDENT", "createdAt": "2026-03-29T09:40:00Z" }
  ],
  "topCourses": [
    { "id": "uuid", "name": "Noor Al-Quran", "type": "Quran", "studentCount": 320 }
  ],
  "monthlyGrowth": {
    "labels": ["Jan","Feb","Mar","Apr","May","Jun"],
    "students": [40,55,62,58,71,80],
    "groups": [6,7,9,8,10,12],
    "courses": [1,2,2,3,3,4]
  },
  "alerts": []
}
```

## Notes
- Respect `Accept-Language` for localized text if needed.
- Use the latest 6 months for `monthlyGrowth` and latest 5 records for `recentRegistrations` and `topCourses` unless otherwise specified.
- Alerts are not required in this version.

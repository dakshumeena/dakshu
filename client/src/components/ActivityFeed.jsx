import React from "react";

const ActivityFeed = ({ activities = [], loading = false }) => {
  return (
    <div className="bg-white dark:bg-zinc-950 dark:bg-gradient-to-br dark:from-zinc-800/70 dark:to-zinc-900/50 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl shadow">
      <h2 className="text-xl font-semibold mb-4 text-zinc-900 dark:text-white">
        Recent Activity
      </h2>

      {loading ? (
        <p className="text-sm text-gray-500 dark:text-zinc-400 text-center py-4">Loading...</p>
      ) : activities.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-zinc-400 text-center py-4">No recent activity</p>
      ) : (
        <div className="space-y-3">
          {activities.map((activity) => (
            <div
              key={activity._id}
              className="border-b border-zinc-200 dark:border-zinc-700 pb-3 last:border-b-0"
            >
              <p className="font-medium text-sm text-zinc-900 dark:text-zinc-200">
                {activity.action}
              </p>

              <p className="text-xs text-gray-500 dark:text-zinc-400">
                {activity.entityType}
              </p>
              <p className="text-sm text-gray-500 dark:text-zinc-400">
                {activity.user?.name}
              </p>

              <p className="text-xs text-gray-400 dark:text-zinc-500">
                {new Date(activity.createdAt).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ActivityFeed;
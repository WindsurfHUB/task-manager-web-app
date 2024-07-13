import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Modal from "react-modal";
import { MdAdd } from "react-icons/md";
import Navbar from "../../components/Navbar/Navbar";
import TaskCard from "../../components/Cards/TaskCard";
import Toast from "../../components/ToastMessage/Toast";
import EmptyCard from "../../components/EmptyCard/EmptyCard";
import AddEditTasks from "./AddEditTasks";
import axiosInstance from "../../utils/axiosInstance";
import AddTasksImg from "../../assets/images/add-task.svg";
import NoDataImg from "../../assets/images/no-data.svg";

const Home = () => {
  const [allTasks, setAllTasks] = useState([]);
  const [isSearch, setIsSearch] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const navigate = useNavigate();

  const [openAddEditModal, setOpenAddEditModal] = useState({
    isShown: false,
    type: "add",
    data: null,
  });
  const [showToastMsg, setShowToastMsg] = useState({
    isShown: false,
    message: "",
    type: "add",
  });
  const handleEdit = (taskDetails) => {
    setOpenAddEditModal({ isShown: true, data: taskDetails, type: "edit" });
  };
  const showToastMessage = (message, type) => {
    setShowToastMsg({
      isShown: true,
      message: message,
      type,
    });
  };
  const handleCloseToast = () => {
    setShowToastMsg({
      isShown: false,
      message: "",
    });
  };

  // API Calls using Axios instance
  // Get all tasks
  const getAllTasks = async () => {
    try {
      const response = await axiosInstance.get("/get-all-tasks");

      if (response.data && response.data.task) {
        setAllTasks(response.data.task);
      }
    } catch (error) {
      console.log("An unexpected error occurred. Please try again.");
    }
  };

  // API Calls using Axios instance
  // Delete task
  const deleteTask = async (data) => {
    const taskId = data._id;
    try {
      const response = await axiosInstance.delete("/delete-task/" + taskId);
      if (response.data && !response.data.error) {
        showToastMessage("Task Deleted Successfully", "delete");
        getAllTasks();
      }
    } catch (error) {
      console.log("An unexpected error occurred. Please try again.");
    }
  };

  // API Calls using Axios instance
  // Get User Info
  const getUserInfo = async () => {
    try {
      const response = await axiosInstance.get("/get-user");
      if (response.data && response.data.user) {
        setUserInfo(response.data.user);
      }
    } catch (error) {
      if (error.response.status === 401) {
        localStorage.clear();
        navigate("/login");
      }
    }
  };

  // API Calls using Axios instance
  // Search for a task
  const onSearchTask = async (query) => {
    try {
      const response = await axiosInstance.get("/search-task", {
        params: { query },
      });

      if(response.data && response.data.task){
        setIsSearch(true);
        setAllTasks(response.data.task);
      }
    } catch (error) {
      console.log("An unexpected error occurred. Please try again.");
    }
  };

  // API Calls using Axios instance
  // update isPinned
  const updateIsPinned = async (taskData) => {
    const taskId = taskData._id;

    try {
      const response = await axiosInstance.put(
        "/update-task-pinned/" + taskId,
        {
          isPinned: !taskData.isPinned,
        }
      );
      if (response.data && response.data.task) {
        showToastMessage("Task Updated Successfully", "update");
        getAllTasks();
      }
      console.log(response.data);
    } catch (error) {
      console.log("An unexpected error occurred. Please try again.");
    }
  };

  const handleClearSearch = () => {
    setIsSearch(false);
    getAllTasks();
  };
  useEffect(() => {
    getAllTasks();
    getUserInfo();
    return () => {};
  }, []);

  return (
    <>
      <Navbar
        userInfo={userInfo}
        onSearchTask={onSearchTask}
        handleClearSearch={handleClearSearch}
      />
      <div className="container mx-auto">
        {isSearch && (
          <h3 className="text-lg font-medium mt-5">Search Results</h3>
        )}
        {allTasks.length > 0 ? (
          <div className="grid grid-cols-3 gap-4 mt-8">
            {allTasks.map((item) => {
              return (
                <TaskCard
                  key={item._id}
                  title={item.title}
                  content={item.content}
                  date={item.createdOn}
                  tags={item.tags}
                  isPinned={item.isPinned}
                  onEdit={() => handleEdit(item)}
                  onDelete={() => deleteTask(item)}
                  onPinTask={() => updateIsPinned(item)}
                />
              );
            })}
          </div>
        ) : (
          <EmptyCard
            imgSrc={isSearch ? NoDataImg : AddTasksImg}
            message={
              isSearch
                ? `Oops! No tasks found matching your search.`
                : `Start creating your first task! Click the 'Add' button to jot down your
          thoughts, ideas, and reminders. Let's get started!`
            }
          />
        )}
      </div>
      <button
        className="w-16 h-16 flex items-center justify-center rounded-2xl bg-primary hover:bg-blue-600 absolute right-10 bottom-10"
        onClick={() => {
          setOpenAddEditModal({ isShown: true, type: "add", data: null });
        }}
      >
        <MdAdd className="text-[32px] text-white" />
      </button>
      <Modal
        isOpen={openAddEditModal.isShown}
        onRequestClose={() => {}}
        style={{
          overlay: {
            backgroundColor: "rgba(0,0,0,0.2)",
          },
        }}
        contentLabel="Example Modal"
        className="w-[40%] max-h-3/4 bg-white rounded-md mx-auto mt-14 p-5 overflow-scroll"
      >
        <AddEditTasks
          type={openAddEditModal.type}
          taskData={openAddEditModal.data}
          onClose={() => {
            setOpenAddEditModal({ isShown: false, type: "add", data: null });
          }}
          showToastMessage={showToastMessage}
          getAllTasks={getAllTasks}
        />
      </Modal>
      <Toast
        isShown={showToastMsg.isShown}
        message={showToastMsg.message}
        type={showToastMsg.type}
        onClose={handleCloseToast}
      />
    </>
  );
};
export default Home;

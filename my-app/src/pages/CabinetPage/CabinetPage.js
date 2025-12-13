import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logout } from "../../store/authSlice";
import "./CabinetPage.css";

export default function CabinetPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const onLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  return (
    <div className="cabinet">
      <div className="cabinet__card">
        <h1 className="cabinet__title">Особистий кабінет</h1>
        <button className="cabinet__button" type="button" onClick={onLogout}>
          Вийти з акаунту
        </button>
      </div>
    </div>
  );
}

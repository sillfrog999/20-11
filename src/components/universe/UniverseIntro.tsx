// Đoạn khai báo phụ đề ấm áp trong UniverseIntro.tsx:
  const getSceneQuote = () => {
    switch (currentScene) {
      case 'THE_VOID':
        return {
          kicker: 'KHỞI NGUYÊN • KHOẢNG LẶNG ĐẦU TIÊN',
          quote: 'Mọi vũ trụ bao la đều bắt đầu từ một điểm sáng nhỏ bé...'
        }
      case 'CONNECT_THE_STARS':
        return {
          kicker: 'KẾT NỐI • NHỮNG VÌ SAO NHỎ',
          quote: 'Mỗi chúng em là một vì sao, và nơi này là nơi chúng mình tìm thấy nhau.'
        }
      case 'OUR_CONSTELLATION':
        return {
          kicker: 'CHÒM SAO KÝ ỨC • THANH XUÂN 9H2',
          quote: 'Bên nhau, chúng ta đã cùng dệt nên những năm tháng đẹp nhất của tuổi học trò.'
        }
      case 'THE_BRIGHTEST_STAR':
        return {
          kicker: 'NGÔI SAO DẪN ĐƯỜNG • ÁNH SÁNG YÊU THƯƠNG',
          quote: 'Và giữa muôn ngàn tinh tú, luôn có một vì sao ấm áp soi đường cho chúng em lớn khôn.'
        }
      default:
        return null
    }
  }

// Đoạn giao diện thanh điều hướng đầu trang (Top Bar):
      <header className="universe-top-bar">
        <div className="universe-badge">
          <span className="star-icon" aria-hidden="true">✦</span>
          <span>VŨ TRỤ KỶ NIỆM 9H2</span>
        </div>

        <div className="universe-controls-group">
          {/* Nút bật tắt âm thanh */}
          <button
            type="button"
            className="btn-cosmic btn-sound-toggle"
            onClick={handleToggleSound}
            aria-label={isMuted ? 'Bật âm thanh không gian' : 'Tắt âm thanh không gian'}
          >
            <span>{isMuted ? '🔇' : '✨'}</span>
            <span>{isMuted ? 'Âm thanh: Tắt' : 'Âm thanh: Bật'}</span>
          </button>

          {/* Nút bỏ qua intro */}
          <button
            type="button"
            className="btn-cosmic btn-skip-intro"
            onClick={handleEnterMainSite}
          >
            <span>Bỏ qua giới thiệu</span>
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </header>

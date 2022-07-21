using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http.Json;
using ServerAPI.Models.Schedule;
using ServerAPI.Services.Schedule;
using System.Text.Json;

namespace ServerAPI.Controllers
{
    public class ScheduleController : Controller
    {
        private readonly IScheduleService scheduleService;

        public ScheduleController(IScheduleService scheduleService)
        {
            this.scheduleService = scheduleService;
        }

        // GET: ScheduleController
        [Route("Schedule/Index")]
        [HttpGet]
        public async Task<IActionResult> Index()
        {
            var viewModel = await this.scheduleService.GetAllWorkoutsAsync<WorkoutViewModels>();
            string json = JsonSerializer.Serialize(viewModel);
            return Json(json);
        }
        public ActionResult Details(int id)
        {
            return View();
        }

        //// GET: ScheduleController/Create
        //public ActionResult Create()
        //{
        //    return View();
        //}

        //// POST: ScheduleController/Create
        //[HttpPost]
        //[ValidateAntiForgeryToken]
        //public ActionResult Create(IFormCollection collection)
        //{
        //    try
        //    {
        //        return RedirectToAction(nameof(Index));
        //    }
        //    catch
        //    {
        //        return View();
        //    }
        //}

        //// GET: ScheduleController/Edit/5
        //public ActionResult Edit(int id)
        //{
        //    return View();
        //}

        //// POST: ScheduleController/Edit/5
        //[HttpPost]
        //[ValidateAntiForgeryToken]
        //public ActionResult Edit(int id, IFormCollection collection)
        //{
        //    try
        //    {
        //        return RedirectToAction(nameof(Index));
        //    }
        //    catch
        //    {
        //        return View();
        //    }
        //}

        //// GET: ScheduleController/Delete/5
        //public ActionResult Delete(int id)
        //{
        //    return View();
        //}

        //// POST: ScheduleController/Delete/5
        //[HttpPost]
        //[ValidateAntiForgeryToken]
        //public ActionResult Delete(int id, IFormCollection collection)
        //{
        //    try
        //    {
        //        return RedirectToAction(nameof(Index));
        //    }
        //    catch
        //    {
        //        return View();
        //    }
        //}
    }
}
